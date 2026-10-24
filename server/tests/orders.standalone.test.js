/**
 * Same safety guarantees on a STANDALONE MongoDB (no transactions):
 * the atomic claim + conditional stock update must still prevent double
 * deduction, and the manual rollback must leave stock untouched.
 */
import './helpers/env.js';
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { connectDB, supportsTransactions } from '../src/config/db.js';
import Category from '../src/models/Category.js';
import Product from '../src/models/Product.js';
import User from '../src/models/User.js';
import Order from '../src/models/Order.js';
import { finalizePaidOrder } from '../src/services/orderService.js';

let server;
let ready = false;
let skipReason = '';

before(async () => {
  try {
    server = await MongoMemoryServer.create();
    await connectDB(server.getUri('fitstore-standalone'));
    ready = true;
  } catch (err) {
    skipReason = `In-memory MongoDB unavailable: ${err.message}`;
  }
});

after(async () => {
  await new Promise((r) => setTimeout(r, 150));
  await mongoose.disconnect();
  if (server) await server.stop();
});

async function setup(stocks) {
  const category = await Category.create({ name: `Cat ${Date.now()}`, slug: `cat-${Date.now()}` });
  const products = await Product.create(
    stocks.map((stock, i) => ({
      name: `P${i}`, slug: `p-${i}-${Date.now()}`, description: 'Standalone fallback test product.', category: category._id,
      price: 500, image: 'https://example.com/p.jpg', stock, sku: `SA-${i}-${Date.now()}`,
    })),
  );
  const user = await User.create({ googleId: `g-${Date.now()}`, name: 'Sam', email: `sam${Date.now()}@example.com` });
  const order = await Order.create({
    orderNumber: `FS-SA-${Date.now()}`,
    user: user._id,
    items: products.map((p) => ({ product: p._id, name: p.name, image: p.image, sku: p.sku, mrp: 500, unitPrice: 500, quantity: 2, lineTotal: 1000 })),
    shippingAddress: { fullName: 'Sam', email: user.email, phone: '9876543210', line1: '1 Test Road', city: 'Delhi', state: 'Delhi', pincode: '110001' },
    subtotal: 1000 * products.length, discount: 0, shippingCharge: 0, totalAmount: 1000 * products.length,
    razorpayOrderId: `order_SA${Date.now()}`,
  });
  return { products, order };
}

test('standalone server falls back to non-transactional mode', (t) => {
  if (!ready) return t.skip(skipReason);
  assert.equal(supportsTransactions(), false);
});

test('concurrent confirmations deduct stock once without transactions', async (t) => {
  if (!ready) return t.skip(skipReason);
  const { products, order } = await setup([10]);
  const results = await Promise.all(
    Array.from({ length: 6 }, () => finalizePaidOrder({ razorpayOrderId: order.razorpayOrderId, razorpayPaymentId: 'pay_SA' })),
  );
  assert.equal(results.filter((r) => r.result === 'paid').length, 1);
  assert.equal((await Product.findById(products[0]._id)).stock, 8);
});

test('partial stock failure rolls back earlier deductions manually', async (t) => {
  if (!ready) return t.skip(skipReason);
  const { products, order } = await setup([10, 1]); // second item cannot be fulfilled (needs 2)
  const { result, order: updated } = await finalizePaidOrder({ razorpayOrderId: order.razorpayOrderId, razorpayPaymentId: 'pay_SA2' });
  assert.equal(result, 'out-of-stock');
  assert.equal(updated.orderStatus, 'Cancelled');
  assert.equal((await Product.findById(products[0]._id)).stock, 10, 'first item restored');
  assert.equal((await Product.findById(products[1]._id)).stock, 1);
});
