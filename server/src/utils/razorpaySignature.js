import crypto from 'node:crypto';

function safeEqualHex(expectedHex, receivedHex) {
  if (typeof receivedHex !== 'string' || !/^[a-f0-9]+$/i.test(receivedHex)) return false;
  const expected = Buffer.from(expectedHex, 'hex');
  const received = Buffer.from(receivedHex, 'hex');
  if (expected.length !== received.length) return false;
  return crypto.timingSafeEqual(expected, received);
}

/**
 * Razorpay's documented Checkout verification:
 * generated_signature = HMAC_SHA256(order_id + "|" + razorpay_payment_id, key_secret)
 */
export function verifyPaymentSignature({ razorpayOrderId, razorpayPaymentId, signature, secret }) {
  if (!razorpayOrderId || !razorpayPaymentId || !signature || !secret) return false;
  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');
  return safeEqualHex(expected, signature);
}
