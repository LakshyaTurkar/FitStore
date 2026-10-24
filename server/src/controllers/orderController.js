import Order from '../models/Order.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import env from '../config/env.js';
import { toPositiveInt } from '../utils/helpers.js';
import { verifyPaymentSignature } from '../utils/razorpaySignature.js';
import { fetchPayment } from '../services/razorpayService.js';
import * as orderService from '../services/orderService.js';

/** POST /orders/checkout  { shippingAddress, saveAddress } */
export const checkout = asyncHandler(async (req, res) => {
  const order = await orderService.createCheckout(req.user, req.body);
  res.status(201).json({
    success: true,
    message: 'Order created. Complete the payment to confirm it.',
    data: {
      order: orderService.serializeOrder(order, req.user),
      payment: orderService.paymentPayload(order, req.user),
    },
  });
});

/** GET /orders/my */
export const myOrders = asyncHandler(async (req, res) => {
  const page = toPositiveInt(req.query.page, 1);
  const limit = toPositiveInt(req.query.limit, 10, 50);
  const filter = { user: req.user._id };
  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select('orderNumber items totalAmount paymentStatus orderStatus createdAt'),
    Order.countDocuments(filter),
  ]);
  res.json({ success: true, data: orders, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

/** GET /orders/:id - owner or admin only. */
export const getOrder = asyncHandler(async (req, res) => {
  const order = await orderService.findOrderForUser(req.params.id, req.user);
  if (req.user.role === 'admin') await order.populate('user', 'name email');
  res.json({ success: true, data: orderService.serializeOrder(order, req.user) });
});

function ensureOwner(order, user) {
  if (String(order.user) !== String(user._id)) throw ApiError.notFound('Order not found.');
}

/**
 * POST /orders/:id/verify-payment
 * Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 * The order becomes "Paid" ONLY if the HMAC signature is valid.
 */
export const verifyPayment = asyncHandler(async (req, res) => {
  const order = await orderService.findOrderForUser(req.params.id, req.user);
  ensureOwner(order, req.user);

  const { razorpay_order_id: rzpOrderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = req.body || {};
  if (!rzpOrderId || !paymentId || !signature) throw ApiError.badRequest('Payment details are missing.');
  if (rzpOrderId !== order.razorpayOrderId) throw ApiError.badRequest('Payment does not belong to this order.');

  const valid = verifyPaymentSignature({
    razorpayOrderId: order.razorpayOrderId, // from OUR database, not the request
    razorpayPaymentId: paymentId,
    signature,
    secret: env.razorpayKeySecret,
  });
  if (!valid) throw ApiError.badRequest('Payment verification failed. Your order has not been marked as paid.');

  const { result, order: updated } = await orderService.finalizePaidOrder({
    razorpayOrderId: order.razorpayOrderId,
    razorpayPaymentId: paymentId,
    signature,
  });

  const messages = {
    paid: 'Payment verified. Your order is confirmed!',
    'already-paid': 'Payment already verified for this order.',
    'out-of-stock': 'Payment received, but an item went out of stock. The order was cancelled and a refund flagged.',
    'late-payment': 'Payment received for a cancelled order. A refund has been flagged.',
  };
  res.json({ success: true, message: messages[result] || 'Payment processed.', data: { result, order: orderService.serializeOrder(updated, req.user) } });
});

/**
 * POST /orders/:id/payment-failed  { razorpay_payment_id }
 * We don't trust the browser's word: the payment status is fetched from Razorpay.
 */
export const reportPaymentFailure = asyncHandler(async (req, res) => {
  const order = await orderService.findOrderForUser(req.params.id, req.user);
  ensureOwner(order, req.user);

  const paymentId = String(req.body?.razorpay_payment_id || '');
  if (!/^pay_[A-Za-z0-9]+$/.test(paymentId)) throw ApiError.badRequest('A valid Razorpay payment id is required.');

  const payment = await fetchPayment(paymentId);
  let updated = order;
  if (payment && payment.order_id === order.razorpayOrderId && payment.status === 'failed') {
    updated =
      (await orderService.markPaymentFailed({
        razorpayOrderId: order.razorpayOrderId,
        razorpayPaymentId: paymentId,
        reason: payment.error_description || 'Payment failed',
      })) || (await Order.findById(order._id));
  }
  res.json({ success: true, data: orderService.serializeOrder(updated, req.user) });
});

/** POST /orders/:id/retry-payment */
export const retryPayment = asyncHandler(async (req, res) => {
  const order = await orderService.findOrderForUser(req.params.id, req.user);
  ensureOwner(order, req.user);
  await orderService.prepareRetry(order);
  res.json({ success: true, data: { order: orderService.serializeOrder(order, req.user), payment: orderService.paymentPayload(order, req.user) } });
});

/** POST /orders/:id/cancel */
export const cancelOrder = asyncHandler(async (req, res) => {
  const order = await orderService.findOrderForUser(req.params.id, req.user);
  ensureOwner(order, req.user);
  const updated = await orderService.cancelByCustomer(order);
  res.json({ success: true, message: 'Order cancelled.', data: orderService.serializeOrder(updated, req.user) });
});
