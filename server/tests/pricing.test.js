import './helpers/env.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateTotals, effectiveUnitPrice, toPaise } from '../src/utils/pricing.js';

const rules = { shippingCharge: 99, freeShippingThreshold: 999 };

test('effective price uses a valid discount price only', () => {
  assert.equal(effectiveUnitPrice({ price: 1000, discountPrice: 800 }), 800);
  assert.equal(effectiveUnitPrice({ price: 1000, discountPrice: null }), 1000);
  assert.equal(effectiveUnitPrice({ price: 1000, discountPrice: 1200 }), 1000, 'discount above price is ignored');
  assert.equal(effectiveUnitPrice({ price: 1000, discountPrice: 0 }), 1000);
});

test('totals: subtotal is MRP, discount is the saving, shipping added below threshold', () => {
  const totals = calculateTotals(
    [
      { price: 500, discountPrice: 400, quantity: 1 }, // pays 400
      { price: 200, discountPrice: null, quantity: 2 }, // pays 400
    ],
    rules,
  );
  assert.deepEqual(totals, { itemsCount: 3, subtotal: 900, discount: 100, shippingCharge: 99, total: 899 });
});

test('totals: free shipping when the discounted amount reaches the threshold', () => {
  const totals = calculateTotals([{ price: 1200, discountPrice: 999, quantity: 1 }], rules);
  assert.equal(totals.shippingCharge, 0);
  assert.equal(totals.total, 999);
});

test('totals: threshold is checked AFTER discount, not on MRP', () => {
  const totals = calculateTotals([{ price: 1500, discountPrice: 998, quantity: 1 }], rules);
  assert.equal(totals.shippingCharge, 99);
  assert.equal(totals.total, 1097);
});

test('totals: empty cart has no shipping charge', () => {
  assert.deepEqual(calculateTotals([], rules), { itemsCount: 0, subtotal: 0, discount: 0, shippingCharge: 0, total: 0 });
});

test('rupees are converted to integer paise for Razorpay', () => {
  assert.equal(toPaise(1999), 199900);
  assert.equal(toPaise(10.1), 1010);
  assert.equal(toPaise(0.29), 29);
});
