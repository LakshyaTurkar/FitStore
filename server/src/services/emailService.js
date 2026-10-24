import { Resend } from 'resend';
import env from '../config/env.js';
import EmailEvent from '../models/EmailEvent.js';
import * as templates from '../templates/emails.js';

let resend;
const getResend = () => {
  if (!resend) resend = new Resend(env.resendApiKey);
  return resend;
};

const isConfigured = () => Boolean(env.resendApiKey && env.resendFromEmail);

/** Keeps error text short and free of keys / email addresses before storing or logging. */
const sanitize = (message) =>
  String(message || 'Unknown error')
    .replace(/re_[A-Za-z0-9_]+/g, '[api-key]')
    .replace(/[^\s@]+@[^\s@]+/g, '[email]')
    .slice(0, 200);

/**
 * Claims an idempotency key. Returns true if this caller should send the email.
 * A key that previously failed can be claimed again (retry); a key that was
 * sent or is being sent cannot - this prevents duplicate emails.
 */
async function claim(key, type) {
  try {
    await EmailEvent.create({ key, type });
    return true;
  } catch (err) {
    if (err.code !== 11000) throw err;
    const retried = await EmailEvent.findOneAndUpdate(
      { key, status: 'failed' },
      { $set: { status: 'sending' }, $inc: { attempts: 1 } },
    );
    return Boolean(retried);
  }
}

/**
 * Sends one email at most once per key. Never throws: an email problem
 * must never undo a payment or an order update.
 */
async function sendOnce({ key, type, to, build }) {
  try {
    if (!(await claim(key, type))) return { skipped: true, reason: 'duplicate' };

    if (!isConfigured()) {
      await EmailEvent.updateOne({ key }, { status: 'skipped', lastError: 'Resend not configured' });
      console.info(`[email] Skipped "${type}" - Resend is not configured.`);
      return { skipped: true, reason: 'not-configured' };
    }

    const { subject, html, text } = build();
    const { data, error } = await getResend().emails.send({ from: env.resendFromEmail, to: [to], subject, html, text });
    if (error) throw new Error(error.message || error.name);

    await EmailEvent.updateOne({ key }, { status: 'sent', providerId: data?.id || null, sentAt: new Date(), lastError: null });
    console.info(`[email] Sent "${type}" (${key}).`);
    return { sent: true };
  } catch (err) {
    const reason = sanitize(err.message);
    console.error(`[email] Failed to send "${type}" (${key}): ${reason}`);
    await EmailEvent.updateOne({ key }, { status: 'failed', lastError: reason }).catch(() => {});
    return { failed: true };
  }
}

export const sendWelcomeEmail = (user) =>
  sendOnce({ key: `welcome:${user._id}`, type: 'welcome', to: user.email, build: () => templates.welcomeEmail(user) });

export const sendOrderConfirmedEmail = (order, user) =>
  sendOnce({ key: `order-confirmed:${order._id}`, type: 'order-confirmed', to: user.email, build: () => templates.orderConfirmedEmail(order, user) });

export const sendPaymentFailedEmail = (order, user, paymentId) =>
  sendOnce({ key: `payment-failed:${order._id}:${paymentId}`, type: 'payment-failed', to: user.email, build: () => templates.paymentFailedEmail(order, user) });

export const sendOrderStatusEmail = (order, user) =>
  sendOnce({ key: `order-status:${order._id}:${order.orderStatus}`, type: 'order-status', to: user.email, build: () => templates.orderStatusEmail(order, user) });

export const sendOrderCancelledEmail = (order, user) =>
  sendOnce({ key: `order-cancelled:${order._id}`, type: 'order-cancelled', to: user.email, build: () => templates.orderCancelledEmail(order, user) });
