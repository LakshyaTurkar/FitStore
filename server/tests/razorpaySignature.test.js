import './helpers/env.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { verifyPaymentSignature } from '../src/utils/razorpaySignature.js';

const secret = 'test_razorpay_secret';
const sign = (data, key = secret) => crypto.createHmac('sha256', key).update(data).digest('hex');

test('valid payment signature is accepted', () => {
  const signature = sign('order_ABC123|pay_XYZ789');
  assert.equal(verifyPaymentSignature({ razorpayOrderId: 'order_ABC123', razorpayPaymentId: 'pay_XYZ789', signature, secret }), true);
});

test('signature for a different payment id is rejected', () => {
  const signature = sign('order_ABC123|pay_OTHER');
  assert.equal(verifyPaymentSignature({ razorpayOrderId: 'order_ABC123', razorpayPaymentId: 'pay_XYZ789', signature, secret }), false);
});

test('signature made with the wrong secret is rejected', () => {
  const signature = sign('order_ABC123|pay_XYZ789', 'attacker_secret');
  assert.equal(verifyPaymentSignature({ razorpayOrderId: 'order_ABC123', razorpayPaymentId: 'pay_XYZ789', signature, secret }), false);
});

test('malformed or missing signatures are rejected without throwing', () => {
  for (const signature of ['', 'not-hex!!', 'abcd', undefined, null]) {
    assert.equal(verifyPaymentSignature({ razorpayOrderId: 'order_A', razorpayPaymentId: 'pay_B', signature, secret }), false);
  }
});
