import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import { runInTransaction } from '../config/db.js';
import { ADMIN_STATUS_TRANSITIONS, CUSTOMER_CANCELLABLE, MAX_SAVED_ADDRESSES, ORDER_STATUS, PAYMENT_STATUS, ROLES } from '../config/constants.js';
import { calculateTotals, effectiveUnitPrice, toPaise } from '../utils/pricing.js';
import { generateOrderNumber, isValidObjectId } from '../utils/helpers.js';
import { validateAddress } from '../utils/validators.js';
import { createRazorpayOrder, publicKeyId } from './razorpayService.js';
import * as emailService from './emailService.js';

class OutOfStockError extends Error {}

const round2 = (n) => Math.round(n * 100) / 100;

// ---------------------------------------------------------------- pricing

/**
 * Turns cart lines ({ product, quantity }) into priced order items using the
 * CURRENT product data from MongoDB. Throws 409 if anything is unavailable.
 */
export async function priceCartItems(cartItems) {
  const ids = cartItems.map((item) => item.product);
  const products = await Product.find({ _id: { $in: ids } });
  const byId = new Map(products.map((p) => [String(p._id), p]));

  const problems = [];
  const lines = [];

  for (const cartItem of cartItems) {
    const product = byId.get(String(cartItem.product));
    if (!product) {
      problems.push({ productId: cartItem.product, message: 'A product in your cart is no longer available.' });
      continue;
    }
    if (product.stock < cartItem.quantity) {
      problems.push({
        productId: product._id,
        name: product.name,
        available: product.stock,
        message: product.stock === 0 ? `${product.name} is out of stock.` : `Only ${product.stock} left for ${product.name}.`,
      });
      continue;
    }
    const unitPrice = effectiveUnitPrice(product);
    lines.push({
      product: product._id,
      name: product.name,
      image: product.image,
      sku: product.sku,
      mrp: product.price,
      unitPrice,
      quantity: cartItem.quantity,
      lineTotal: round2(unitPrice * cartItem.quantity),
      // used only for the totals calculation below
      price: product.price,
      discountPrice: product.discountPrice,
    });
  }

  if (problems.length) {
    throw ApiError.conflict('Some items in your cart are unavailable. Please update your cart.', problems);
  }

  const totals = calculateTotals(lines);
  const items = lines.map(({ price, discountPrice, ...item }) => item);
  return { items, totals };
}

/** Data the browser needs to open Razorpay Checkout. No secrets here. */
export function paymentPayload(order, user) {
  return {
    keyId: publicKeyId(),
    razorpayOrderId: order.razorpayOrderId,
    amount: toPaise(order.totalAmount),
    currency: order.currency,
    name: 'FitStore',
    description: `Order ${order.orderNumber} (Test Mode)`,
    prefill: { name: order.shippingAddress.fullName || user.name, email: user.email, contact: order.shippingAddress.phone },
  };
}

// ---------------------------------------------------------------- checkout

async function saveAddressForUser(userId, address) {
  const user = await User.findById(userId);
  if (!user) return;
  const duplicate = user.addresses.some(
    (a) => a.line1.toLowerCase() === address.line1.toLowerCase() && a.pincode === address.pincode,
  );
  if (duplicate || user.addresses.length >= MAX_SAVED_ADDRESSES) return;
  user.addresses.push(address);
  await user.save();
}

/**
 * 1. validate address, 2. price the server-side cart with current DB prices,
 * 3. verify stock, 4. create a pending order, 5. create the Razorpay order.
 */
export async function createCheckout(user, body = {}) {
  if (!user.cart.length) throw ApiError.badRequest('Your cart is empty.');

  const address = validateAddress(body.shippingAddress);
  const { items, totals } = await priceCartItems(user.cart);

  const order = await Order.create({
    orderNumber: generateOrderNumber(),
    user: user._id,
    items,
    shippingAddress: { ...address, email: user.email },
    subtotal: totals.subtotal,
    discount: totals.discount,
    shippingCharge: totals.shippingCharge,
    totalAmount: totals.total,
    currency: 'INR',
    statusHistory: [{ status: ORDER_STATUS.PENDING_PAYMENT, note: 'Order placed. Awaiting payment.', changedBy: 'customer' }],
  });

  try {
    const rzpOrder = await createRazorpayOrder({
      amountPaise: toPaise(order.totalAmount),
      receipt: order.orderNumber,
      notes: { orderId: String(order._id), orderNumber: order.orderNumber },
    });
    order.razorpayOrderId = rzpOrder.id;
    await order.save();
  } catch (err) {
    // Without a gateway order the pending order is useless - remove it.
    await Order.deleteOne({ _id: order._id });
    throw err;
  }

  if (body.saveAddress) {
    await saveAddressForUser(user._id, address).catch((err) => console.error('[checkout] Could not save address:', err.message));
  }

  return order;
}

/** Re-checks stock before letting the customer pay again for a pending order. */
export async function prepareRetry(order) {
  if (order.orderStatus !== ORDER_STATUS.PENDING_PAYMENT || ![PAYMENT_STATUS.PENDING, PAYMENT_STATUS.FAILED].includes(order.paymentStatus)) {
    throw ApiError.conflict('This order can no longer be paid.');
  }
  if (!order.razorpayOrderId) throw ApiError.conflict('This order has no payment session. Please place a new order.');

  // Throws 409 with details if stock has run out since the order was placed.
  await priceCartItems(order.items.map((i) => ({ product: i.product, quantity: i.quantity })));
  // The Razorpay order is reused: Razorpay allows multiple payment attempts
  // on the same order until one succeeds, so the amount stays locked.
  return order;
}

// ---------------------------------------------------------------- payment result

async function restoreStock(items, session = null) {
  if (!items.length) return;
  await Product.bulkWrite(
    items.map((item) => ({
      updateOne: { filter: { _id: item.product }, update: { $inc: { stock: item.quantity, soldCount: -item.quantity } } },
    })),
    { session },
  );
}

async function notify(order, sendFn) {
  const user = await User.findById(order.user);
  if (user) await sendFn(order, user);
}

/**
 * Marks an order as paid AFTER the payment signature has been verified.
 * Safe to call many times for the same payment:
 *  - the order is "claimed" with an atomic conditional update, so only the
 *    first caller proceeds (no duplicate stock deduction / emails);
 *  - stock is decremented only if enough remains ({ stock: { $gte: qty } });
 *  - everything runs in a MongoDB transaction when the cluster supports it.
 *
 * @returns {{ result: 'paid'|'already-paid'|'out-of-stock'|'late-payment'|'not-found', order }}
 */
export async function finalizePaidOrder({ razorpayOrderId, razorpayPaymentId, signature = null }) {
  const now = new Date();
  let outcome;

  try {
    outcome = await runInTransaction(async (session) => {
      const order = await Order.findOneAndUpdate(
        {
          razorpayOrderId,
          paymentStatus: { $in: [PAYMENT_STATUS.PENDING, PAYMENT_STATUS.FAILED] },
          orderStatus: ORDER_STATUS.PENDING_PAYMENT,
        },
        {
          $set: {
            paymentStatus: PAYMENT_STATUS.PAID,
            orderStatus: ORDER_STATUS.CONFIRMED,
            razorpayPaymentId,
            razorpaySignature: signature,
            paymentVerifiedAt: now,
            paymentFailureReason: null,
          },
          $inc: { paymentAttempts: 1 },
          $push: {
            statusHistory: {
              status: ORDER_STATUS.CONFIRMED,
              note: 'Payment verified (checkout signature).',
              changedBy: 'system',
              at: now,
            },
          },
        },
        { new: true, session },
      );
      if (!order) return { claimed: false };

      const deducted = [];
      for (const item of order.items) {
        const res = await Product.updateOne(
          { _id: item.product, stock: { $gte: item.quantity } },
          { $inc: { stock: -item.quantity, soldCount: item.quantity } },
          { session },
        );
        if (res.modifiedCount !== 1) {
          if (!session) await restoreStock(deducted); // manual rollback without transactions
          throw new OutOfStockError(item.name);
        }
        deducted.push(item);
      }

      await Order.updateOne({ _id: order._id }, { $set: { stockDeducted: true } }, { session });
      order.stockDeducted = true;
      return { claimed: true, order };
    });
  } catch (err) {
    if (!(err instanceof OutOfStockError)) throw err;
    return handlePaidButOutOfStock({ razorpayOrderId, razorpayPaymentId, productName: err.message });
  }

  if (outcome.claimed) {
    const { order } = outcome;
    // Remove purchased products from the customer's cart.
    await User.updateOne(
      { _id: order.user },
      { $pull: { cart: { product: { $in: order.items.map((i) => i.product) } } } },
    ).catch((e) => console.error('[order] Cart cleanup failed:', e.message));
    // Fire-and-forget: email failure must not affect the paid order.
    notify(order, emailService.sendOrderConfirmedEmail).catch(() => {});
    return { result: 'paid', order };
  }

  // Not claimed: either already processed (idempotent repeat) or cancelled.
  const existing = await Order.findOne({ razorpayOrderId });
  if (!existing) return { result: 'not-found', order: null };
  if (existing.paymentStatus === PAYMENT_STATUS.PAID || existing.razorpayPaymentId === razorpayPaymentId) {
    return { result: 'already-paid', order: existing };
  }
  return recordLatePayment(existing, razorpayPaymentId);
}

/** Payment succeeded but stock ran out in the meantime: cancel + flag refund. */
async function handlePaidButOutOfStock({ razorpayOrderId, razorpayPaymentId, productName }) {
  const now = new Date();
  const order = await Order.findOneAndUpdate(
    { razorpayOrderId, stockDeducted: false, orderStatus: { $in: [ORDER_STATUS.PENDING_PAYMENT, ORDER_STATUS.CONFIRMED] } },
    {
      $set: {
        paymentStatus: PAYMENT_STATUS.REFUNDED,
        orderStatus: ORDER_STATUS.CANCELLED,
        razorpayPaymentId,
        paymentVerifiedAt: now,
        cancelledAt: now,
        cancellationReason: `"${productName}" went out of stock before payment completed.`,
        refundNote: 'Simulated refund (demo). In test mode the admin can issue a test refund from the Razorpay Dashboard.',
      },
      $push: { statusHistory: { status: ORDER_STATUS.CANCELLED, note: 'Paid, but item went out of stock. Refund flagged.', changedBy: 'system', at: now } },
    },
    { new: true },
  );
  const finalOrder = order || (await Order.findOne({ razorpayOrderId }));
  if (order) notify(order, emailService.sendOrderCancelledEmail).catch(() => {});
  return { result: 'out-of-stock', order: finalOrder };
}

/** A payment arrived for an order that had already been cancelled. */
async function recordLatePayment(order, razorpayPaymentId) {
  const now = new Date();
  const updated = await Order.findOneAndUpdate(
    { _id: order._id, razorpayPaymentId: { $in: [null, razorpayPaymentId] } },
    {
      $set: {
        razorpayPaymentId,
        paymentStatus: PAYMENT_STATUS.REFUNDED,
        paymentVerifiedAt: now,
        refundNote: 'Payment received after the order was cancelled. Simulated refund (demo) - issue a test refund from the Razorpay Dashboard.',
      },
      $push: { statusHistory: { status: order.orderStatus, note: 'Late payment received for a cancelled order. Refund flagged.', changedBy: 'system', at: now } },
    },
    { new: true },
  );
  return { result: 'late-payment', order: updated || order };
}

/** Records a failed attempt (only for orders still awaiting payment). */
export async function markPaymentFailed({ razorpayOrderId, razorpayPaymentId, reason }) {
  const now = new Date();
  const safeReason = String(reason || 'Payment failed').slice(0, 200);
  const order = await Order.findOneAndUpdate(
    {
      razorpayOrderId,
      orderStatus: ORDER_STATUS.PENDING_PAYMENT,
      paymentStatus: { $in: [PAYMENT_STATUS.PENDING, PAYMENT_STATUS.FAILED] },
    },
    {
      $set: { paymentStatus: PAYMENT_STATUS.FAILED, paymentFailureReason: safeReason },
      $inc: { paymentAttempts: 1 },
      $push: { statusHistory: { status: 'Payment Failed', note: safeReason, changedBy: 'system', at: now } },
    },
    { new: true },
  );
  if (order && razorpayPaymentId) {
    // Keyed by payment id: repeated reports of the same failed attempt send one email.
    const user = await User.findById(order.user);
    if (user) emailService.sendPaymentFailedEmail(order, user, razorpayPaymentId).catch(() => {});
  }
  return order;
}

// ---------------------------------------------------------------- cancellation & status

/**
 * Cancels an order if it is currently in one of `allowedFrom`. Restocks
 * inventory exactly once (guarded by the stockDeducted flag).
 */
export async function cancelOrder({ orderId, allowedFrom, actor, reason }) {
  const now = new Date();

  const order = await runInTransaction(async (session) => {
    const cancelled = await Order.findOneAndUpdate(
      { _id: orderId, orderStatus: { $in: allowedFrom } },
      {
        $set: { orderStatus: ORDER_STATUS.CANCELLED, cancelledAt: now, cancellationReason: reason },
        $push: { statusHistory: { status: ORDER_STATUS.CANCELLED, note: reason, changedBy: actor, at: now } },
      },
      { new: true, session },
    );
    if (!cancelled) return null;

    const released = await Order.findOneAndUpdate(
      { _id: orderId, stockDeducted: true },
      { $set: { stockDeducted: false } },
      { session },
    );
    if (released) await restoreStock(cancelled.items, session);

    if (cancelled.paymentStatus === PAYMENT_STATUS.PAID) {
      return Order.findOneAndUpdate(
        { _id: orderId },
        {
          $set: {
            paymentStatus: PAYMENT_STATUS.REFUNDED,
            refundNote: 'Simulated refund (demo) - no real money moved. A test refund can be issued from the Razorpay Dashboard.',
          },
        },
        { new: true, session },
      );
    }
    return Order.findById(orderId).session(session);
  });

  if (order) notify(order, emailService.sendOrderCancelledEmail).catch(() => {});
  return order;
}

export async function cancelByCustomer(order) {
  const updated = await cancelOrder({
    orderId: order._id,
    allowedFrom: CUSTOMER_CANCELLABLE,
    actor: 'customer',
    reason: 'Cancelled by customer.',
  });
  if (!updated) throw ApiError.conflict('This order can no longer be cancelled.');
  return updated;
}

/** Admin status changes, validated against ADMIN_STATUS_TRANSITIONS. */
export async function updateStatusByAdmin(orderId, nextStatus, note = '') {
  if (!isValidObjectId(orderId)) throw ApiError.notFound('Order not found.');
  const order = await Order.findById(orderId);
  if (!order) throw ApiError.notFound('Order not found.');

  const allowed = ADMIN_STATUS_TRANSITIONS[order.orderStatus] || [];
  if (!allowed.includes(nextStatus)) {
    throw ApiError.badRequest(
      `Cannot change status from "${order.orderStatus}" to "${nextStatus}".`,
      { allowed },
    );
  }
  const cleanNote = String(note || '').trim().slice(0, 300);

  if (nextStatus === ORDER_STATUS.CANCELLED) {
    const cancelled = await cancelOrder({
      orderId,
      allowedFrom: [order.orderStatus],
      actor: 'admin',
      reason: cleanNote || 'Cancelled by FitStore.',
    });
    if (!cancelled) throw ApiError.conflict('The order changed in the meantime. Please refresh and try again.');
    return cancelled;
  }

  const now = new Date();
  const set = { orderStatus: nextStatus };
  if (nextStatus === ORDER_STATUS.SHIPPED && !order.demoTrackingNumber) {
    set.demoTrackingNumber = `DEMO-TRK-${order.orderNumber.slice(-6)}`;
  }

  const updated = await Order.findOneAndUpdate(
    { _id: orderId, orderStatus: order.orderStatus }, // optimistic concurrency
    { $set: set, $push: { statusHistory: { status: nextStatus, note: cleanNote, changedBy: 'admin', at: now } } },
    { new: true },
  );
  if (!updated) throw ApiError.conflict('The order changed in the meantime. Please refresh and try again.');

  notify(updated, emailService.sendOrderStatusEmail).catch(() => {});
  return updated;
}

// ---------------------------------------------------------------- access & serialisation

/** Customers can only see their own orders; admins can see all. Returns 404 otherwise. */
export async function findOrderForUser(orderId, user) {
  if (!isValidObjectId(orderId)) throw ApiError.notFound('Order not found.');
  const order = await Order.findById(orderId);
  const isOwner = order && String(order.user) === String(user._id);
  if (!order || (!isOwner && user.role !== ROLES.ADMIN)) throw ApiError.notFound('Order not found.');
  return order;
}

export function serializeOrder(order, user) {
  const json = order.toObject({ versionKey: false });
  delete json.razorpaySignature;
  const isOwner = String(order.user?._id || order.user) === String(user._id);
  return {
    ...json,
    canCancel: isOwner && CUSTOMER_CANCELLABLE.includes(order.orderStatus),
    canRetryPayment:
      isOwner &&
      order.orderStatus === ORDER_STATUS.PENDING_PAYMENT &&
      [PAYMENT_STATUS.PENDING, PAYMENT_STATUS.FAILED].includes(order.paymentStatus),
    allowedNextStatuses: user.role === ROLES.ADMIN ? ADMIN_STATUS_TRANSITIONS[order.orderStatus] || [] : undefined,
  };
}
