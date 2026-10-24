import Razorpay from 'razorpay';
import env from '../config/env.js';
import ApiError from '../utils/ApiError.js';

let instance;

function getRazorpay() {
  if (!env.razorpayKeyId || !env.razorpayKeySecret) {
    throw new ApiError(503, 'Payment gateway is not configured on the server.');
  }
  if (!env.razorpayKeyId.startsWith('rzp_test_')) {
    throw new ApiError(503, 'Only Razorpay TEST keys are allowed in this demo project.');
  }
  if (!instance) {
    instance = new Razorpay({ key_id: env.razorpayKeyId, key_secret: env.razorpayKeySecret });
  }
  return instance;
}

/** Creates a Razorpay order for a server-calculated amount (in paise). */
export async function createRazorpayOrder({ amountPaise, receipt, notes }) {
  try {
    return await getRazorpay().orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt: receipt.slice(0, 40),
      notes,
    });
  } catch (err) {
    if (err instanceof ApiError) throw err;
    console.error('[razorpay] Order creation failed:', err?.error?.description || err.message);
    throw new ApiError(502, 'Could not start the payment. Please try again.');
  }
}

/** Fetches a payment directly from Razorpay (trusted source of truth). */
export async function fetchPayment(paymentId) {
  try {
    return await getRazorpay().payments.fetch(paymentId);
  } catch (err) {
    console.error('[razorpay] Payment fetch failed:', err?.error?.description || err.message);
    return null;
  }
}

export const publicKeyId = () => env.razorpayKeyId;
