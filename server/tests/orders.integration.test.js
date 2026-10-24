/**
 * Integration tests against a real (in-memory) MongoDB replica set, so the
 * transaction code path is exercised. The first run downloads a MongoDB
 * binary (~100 MB); if that is impossible (offline), these tests are skipped.
 */
import './helpers/env.js';
import { after, before, beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import app from '../src/app.js';
import { connectDB, supportsTransactions } from '../src/config/db.js';
import Category from '../src/models/Category.js';
import Product from '../src/models/Product.js';
import User from '../src/models/User.js';
import Order from '../src/models/Order.js';
import EmailEvent from '../src/models/EmailEvent.js';
import { signToken } from '../src/utils/token.js';
import { cancelByCustomer, finalizePaidOrder, markPaymentFailed } from '../src/services/orderService.js';

let replSet;
let ready = false;
let skipReason = '';

const SECRET = process.env.RAZORPAY_KEY_SECRET;
const sign = (data, key = SECRET) => crypto.createHmac('sha256', key).update(data).digest('hex');
const settle = () => new Promise((r) => setTimeout(r, 150)); // let fire-and-forget emails finish

let category;
let product;
let alice;
let bob;

const agentFor = (user) => ({
  get: (url) => request(app).get(url).set('Cookie', `fitstore_token=${signToken(user._id)}`),
  post: (url, body) => request(app).post(url).set('Cookie', `fitstore_token=${signToken(user._id)}`).set('X-FitStore-Client', 'web').send(body),
});

async function makePendingOrder(user, { quantity = 2, rzpId = `order_${crypto.randomBytes(6).toString('hex')}` } = {}) {
  return Order.create({
    orderNumber: `FS-TEST-${crypto.randomBytes(3).toString('hex')}`,
    user: user._id,
    items: [{ product: product._id, name: product.name, image: product.image, sku: product.sku, mrp: 1000, unitPrice: 800, quantity, lineTotal: 800 * quantity }],
    shippingAddress: { fullName: 'Alice', email: user.email, phone: '9876543210', line1: '12 Test Street', city: 'Pune', state: 'Maharashtra', pincode: '411001' },
    subtotal: 1000 * quantity,
    discount: 200 * quantity,
    shippingCharge: 0,
    totalAmount: 800 * quantity,
    razorpayOrderId: rzpId,
  });
}

before(async () => {
  try {
    replSet = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: 'wiredTiger' } });
    await connectDB(replSet.getUri('fitstore-test'));
    ready = true;
  } catch (err) {
    skipReason = `In-memory MongoDB unavailable: ${err.message}`;
    console.warn(`[test] ${skipReason}`);
  }
});

after(async () => {
  await settle();
  await mongoose.disconnect();
  if (replSet) await replSet.stop();
});

beforeEach(async () => {
  if (!ready) return;
  await Promise.all([Category.deleteMany({}), Product.deleteMany({}), User.deleteMany({}), Order.deleteMany({}), EmailEvent.deleteMany({})]);
  category = await Category.create({ name: 'Gym Equipment', slug: 'gym-equipment' });
  product = await Product.create({
    name: 'Test Dumbbell', slug: 'test-dumbbell', description: 'A test dumbbell for integration tests.', category: category._id,
    price: 1000, discountPrice: 800, image: 'https://example.com/d.jpg', stock: 5, sku: 'TEST-DB-1',
  });
  alice = await User.create({ googleId: 'g-alice', name: 'Alice', email: 'alice@example.com' });
  bob = await User.create({ googleId: 'g-bob', name: 'Bob', email: 'bob@example.com' });
});

describe('payments and orders (MongoDB)', () => {
  test('replica set enables the transaction code path', (t) => {
    if (!ready) return t.skip(skipReason);
    assert.equal(supportsTransactions(), true);
  });

  test('repeated verification callbacks deduct stock and send the email only once', async (t) => {
    if (!ready) return t.skip(skipReason);
    const order = await makePendingOrder(alice, { quantity: 2 });
    const body = {
      razorpay_order_id: order.razorpayOrderId,
      razorpay_payment_id: 'pay_TEST123',
      razorpay_signature: sign(`${order.razorpayOrderId}|pay_TEST123`),
    };

    const first = await agentFor(alice).post(`/orders/${order._id}/verify-payment`, body);
    assert.equal(first.status, 200);
    assert.equal(first.body.data.result, 'paid');
    assert.equal(first.body.data.order.paymentStatus, 'Paid');
    assert.equal(first.body.data.order.orderStatus, 'Confirmed');

    const second = await agentFor(alice).post(`/orders/${order._id}/verify-payment`, body);
    assert.equal(second.status, 200);
    assert.equal(second.body.data.result, 'already-paid');

    await settle();
    assert.equal((await Product.findById(product._id)).stock, 3, 'stock deducted exactly once (5 - 2)');
    assert.equal(await EmailEvent.countDocuments({ key: `order-confirmed:${order._id}` }), 1);
  });

  test('concurrent payment confirmations are processed once', async (t) => {
    if (!ready) return t.skip(skipReason);
    const order = await makePendingOrder(alice, { quantity: 1 });
    const results = await Promise.all(
      Array.from({ length: 5 }, () =>
        finalizePaidOrder({ razorpayOrderId: order.razorpayOrderId, razorpayPaymentId: 'pay_RACE' }),
      ),
    );
    assert.equal(results.filter((r) => r.result === 'paid').length, 1);
    assert.equal((await Product.findById(product._id)).stock, 4);
    assert.equal((await Product.findById(product._id)).soldCount, 1);
  });

  test('an invalid signature never marks the order as paid', async (t) => {
    if (!ready) return t.skip(skipReason);
    const order = await makePendingOrder(alice);
    const res = await agentFor(alice).post(`/orders/${order._id}/verify-payment`, {
      razorpay_order_id: order.razorpayOrderId,
      razorpay_payment_id: 'pay_FAKE',
      razorpay_signature: sign(`${order.razorpayOrderId}|pay_FAKE`, 'wrong-secret'),
    });
    assert.equal(res.status, 400);
    const fresh = await Order.findById(order._id);
    assert.equal(fresh.paymentStatus, 'Pending');
    assert.equal(fresh.stockDeducted, false);
    assert.equal((await Product.findById(product._id)).stock, 5);
  });

  test('a failed payment stays unpaid, and a later successful retry is accepted', async (t) => {
    if (!ready) return t.skip(skipReason);
    const order = await makePendingOrder(alice);
    const failed = await markPaymentFailed({ razorpayOrderId: order.razorpayOrderId, razorpayPaymentId: 'pay_F1', reason: 'Card declined' });
    assert.equal(failed.paymentStatus, 'Failed');
    assert.equal(failed.orderStatus, 'Pending Payment');
    assert.equal((await Product.findById(product._id)).stock, 5);

    const { result } = await finalizePaidOrder({ razorpayOrderId: order.razorpayOrderId, razorpayPaymentId: 'pay_OK' });
    assert.equal(result, 'paid');

    // A late "failed" report must not downgrade a paid order.
    const after = await markPaymentFailed({ razorpayOrderId: order.razorpayOrderId, razorpayPaymentId: 'pay_F2', reason: 'late' });
    assert.equal(after, null);
    assert.equal((await Order.findById(order._id)).paymentStatus, 'Paid');
  });

  test('payment for an item that sold out cancels the order and flags a refund (no negative stock)', async (t) => {
    if (!ready) return t.skip(skipReason);
    const order = await makePendingOrder(alice, { quantity: 2 });
    await Product.updateOne({ _id: product._id }, { $set: { stock: 1 } });

    const { result, order: updated } = await finalizePaidOrder({ razorpayOrderId: order.razorpayOrderId, razorpayPaymentId: 'pay_SOLDOUT' });
    assert.equal(result, 'out-of-stock');
    assert.equal(updated.orderStatus, 'Cancelled');
    assert.equal(updated.paymentStatus, 'Refunded');
    assert.equal((await Product.findById(product._id)).stock, 1);
  });

  test('cancelling a paid order restocks exactly once', async (t) => {
    if (!ready) return t.skip(skipReason);
    const order = await makePendingOrder(alice, { quantity: 2 });
    await finalizePaidOrder({ razorpayOrderId: order.razorpayOrderId, razorpayPaymentId: 'pay_C' });
    assert.equal((await Product.findById(product._id)).stock, 3);

    const cancelled = await cancelByCustomer(await Order.findById(order._id));
    assert.equal(cancelled.orderStatus, 'Cancelled');
    assert.equal(cancelled.paymentStatus, 'Refunded');
    await assert.rejects(() => cancelByCustomer(cancelled), /can no longer be cancelled/);
    assert.equal((await Product.findById(product._id)).stock, 5);
  });

  test("customers cannot read or pay for another customer's order", async (t) => {
    if (!ready) return t.skip(skipReason);
    const order = await makePendingOrder(alice);
    const view = await agentFor(bob).get(`/orders/${order._id}`);
    assert.equal(view.status, 404);

    const pay = await agentFor(bob).post(`/orders/${order._id}/verify-payment`, {
      razorpay_order_id: order.razorpayOrderId,
      razorpay_payment_id: 'pay_BOB',
      razorpay_signature: sign(`${order.razorpayOrderId}|pay_BOB`),
    });
    assert.equal(pay.status, 404);

    const own = await agentFor(alice).get(`/orders/${order._id}`);
    assert.equal(own.status, 200);
  });

  test('cart totals are calculated by the server and stock limits are enforced', async (t) => {
    if (!ready) return t.skip(skipReason);
    const add = await agentFor(alice).post('/cart/items', { productId: String(product._id), quantity: 1 });
    assert.equal(add.status, 201);
    assert.deepEqual(add.body.data.totals, { itemsCount: 1, subtotal: 1000, discount: 200, shippingCharge: 99, total: 899 });

    const tooMany = await agentFor(alice).post('/cart/items', { productId: String(product._id), quantity: 5 });
    assert.equal(tooMany.status, 400);
    assert.match(tooMany.body.message, /Only 5/);

    await Product.updateOne({ _id: product._id }, { $set: { stock: 0 } });
    const checkout = await agentFor(alice).post('/orders/checkout', {
      shippingAddress: { fullName: 'Alice', phone: '9876543210', line1: '12 Test Street', city: 'Pune', state: 'Maharashtra', pincode: '411001' },
    });
    assert.equal(checkout.status, 409, 'out-of-stock items cannot be checked out');
    assert.equal(await Order.countDocuments(), 0);
  });

  test('product listing supports search, category filter, price filter and pagination', async (t) => {
    if (!ready) return t.skip(skipReason);
    await Product.create({
      name: 'Yoga Mat Test', slug: 'yoga-mat-test', description: 'A test yoga mat for integration tests.', category: category._id,
      price: 2000, image: 'https://example.com/m.jpg', stock: 3, sku: 'TEST-MAT-1',
    });
    const search = await request(app).get('/products?search=yoga');
    assert.equal(search.body.data.length, 1);
    const price = await request(app).get('/products?maxPrice=900');
    assert.deepEqual(price.body.data.map((p) => p.sku), ['TEST-DB-1']);
    const paged = await request(app).get('/products?limit=1&page=2&sort=price_asc');
    assert.equal(paged.body.pagination.total, 2);
    assert.equal(paged.body.data[0].sku, 'TEST-MAT-1');
    const cat = await request(app).get('/products?category=unknown');
    assert.equal(cat.body.data.length, 0);
    const detail = await request(app).get('/products/test-dumbbell');
    assert.equal(detail.body.data.product.finalPrice, 800);
  });
});
