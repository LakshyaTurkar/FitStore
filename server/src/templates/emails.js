import env from '../config/env.js';
import { escapeHtml, formatINR } from '../utils/helpers.js';
import { renderLayout, BRAND } from './emailLayout.js';

const p = (text) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;">${text}</p>`;
const orderUrl = (order) => `${env.clientUrl}/orders/${order._id}`;

function itemsTable(order) {
  const rows = order.items
    .map(
      (item) => `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #eee;font-size:14px;">${escapeHtml(item.name)} &times; ${item.quantity}</td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;font-size:14px;text-align:right;">${escapeHtml(formatINR(item.lineTotal))}</td>
      </tr>`,
    )
    .join('');

  const line = (label, value, bold = false) => `<tr>
      <td style="padding:6px 0;font-size:14px;${bold ? 'font-weight:700;' : ''}">${label}</td>
      <td style="padding:6px 0;font-size:14px;text-align:right;${bold ? 'font-weight:700;' : ''}">${escapeHtml(value)}</td>
    </tr>`;

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 18px;">
    ${rows}
    ${line('Subtotal (MRP)', formatINR(order.subtotal))}
    ${order.discount ? line('Discount', `- ${formatINR(order.discount)}`) : ''}
    ${line('Shipping', order.shippingCharge ? formatINR(order.shippingCharge) : 'FREE')}
    ${line('Total', formatINR(order.totalAmount), true)}
  </table>`;
}

function addressBlock(order) {
  const a = order.shippingAddress;
  const lines = [a.fullName, a.line1, a.line2, `${a.city}, ${a.state} - ${a.pincode}`, `Phone: ${a.phone}`]
    .filter(Boolean)
    .map(escapeHtml)
    .join('<br>');
  return `<div style="background:#fafafa;border-radius:8px;padding:12px 14px;font-size:14px;line-height:1.6;margin-bottom:16px;">
    <strong>Delivery address</strong><br>${lines}</div>`;
}

const orderMeta = (order) =>
  p(`<strong>Order:</strong> ${escapeHtml(order.orderNumber)}<br>
     <strong>Payment status:</strong> ${escapeHtml(order.paymentStatus)}<br>
     <strong>Order status:</strong> ${escapeHtml(order.orderStatus)}`);

function textItems(order) {
  return order.items.map((i) => `- ${i.name} x ${i.quantity}: ${formatINR(i.lineTotal)}`).join('\n');
}

function textAddress(order) {
  const a = order.shippingAddress;
  return [a.fullName, a.line1, a.line2, `${a.city}, ${a.state} - ${a.pincode}`, `Phone: ${a.phone}`].filter(Boolean).join('\n');
}

// ------------------------------------------------------------------ templates

export function welcomeEmail(user) {
  const name = escapeHtml(user.name);
  return {
    subject: 'Welcome to FitStore!',
    html: renderLayout({
      preheader: 'Your FitStore account is ready.',
      title: `Welcome, ${user.name}!`,
      bodyHtml:
        p(`Hi ${name}, thanks for signing in to <strong>FitStore</strong> with Google. Your account is ready.`) +
        p('Explore gym equipment, supplements, sportswear, shoes and recovery gear - all in one place.'),
      cta: { label: 'Start Shopping', url: `${env.clientUrl}/shop` },
    }),
    text: `Welcome to FitStore, ${user.name}!\n\nYour account is ready. Start shopping: ${env.clientUrl}/shop\n\nFitStore is a college demo project.`,
  };
}

export function orderConfirmedEmail(order, user) {
  return {
    subject: `Order confirmed - ${order.orderNumber}`,
    html: renderLayout({
      preheader: `Payment received for order ${order.orderNumber}.`,
      title: 'Your order is confirmed!',
      bodyHtml:
        p(`Hi ${escapeHtml(user.name)}, we have received your payment (test mode) and your order is confirmed.`) +
        orderMeta(order) +
        itemsTable(order) +
        addressBlock(order),
      cta: { label: 'View Order', url: orderUrl(order) },
    }),
    text: `Hi ${user.name},\n\nYour FitStore order ${order.orderNumber} is confirmed.\nPayment status: ${order.paymentStatus}\n\n${textItems(order)}\nTotal: ${formatINR(order.totalAmount)}\n\nDelivery address:\n${textAddress(order)}\n\nView your order: ${orderUrl(order)}`,
  };
}

export function paymentFailedEmail(order, user) {
  return {
    subject: `Payment not completed - ${order.orderNumber}`,
    html: renderLayout({
      preheader: 'Your payment did not go through. You can retry.',
      title: 'Payment not completed',
      bodyHtml:
        p(`Hi ${escapeHtml(user.name)}, your payment for order <strong>${escapeHtml(order.orderNumber)}</strong> was not completed. No money was charged (test mode).`) +
        (order.paymentFailureReason ? p(`<strong>Reason:</strong> ${escapeHtml(order.paymentFailureReason)}`) : '') +
        p(`<strong>Amount due:</strong> ${escapeHtml(formatINR(order.totalAmount))}`) +
        p('You can retry the payment from your order page while the items are still in stock.'),
      cta: { label: 'Retry Payment', url: orderUrl(order) },
    }),
    text: `Hi ${user.name},\n\nYour payment for order ${order.orderNumber} was not completed.${order.paymentFailureReason ? `\nReason: ${order.paymentFailureReason}` : ''}\nAmount due: ${formatINR(order.totalAmount)}\n\nRetry here: ${orderUrl(order)}`,
  };
}

export function orderStatusEmail(order, user) {
  const tracking = order.demoTrackingNumber
    ? p(`<strong>Tracking number (demo):</strong> ${escapeHtml(order.demoTrackingNumber)} <span style="color:${BRAND.grey};">- simulated, not a real courier.</span>`)
    : '';
  return {
    subject: `Order ${order.orderNumber} is now ${order.orderStatus}`,
    html: renderLayout({
      preheader: `Status update: ${order.orderStatus}`,
      title: `Order update: ${order.orderStatus}`,
      bodyHtml:
        p(`Hi ${escapeHtml(user.name)}, the status of your order <strong>${escapeHtml(order.orderNumber)}</strong> has changed.`) +
        orderMeta(order) +
        tracking +
        itemsTable(order),
      cta: { label: 'View Order', url: orderUrl(order) },
    }),
    text: `Hi ${user.name},\n\nYour order ${order.orderNumber} is now: ${order.orderStatus}.${order.demoTrackingNumber ? `\nTracking (demo): ${order.demoTrackingNumber}` : ''}\n\n${textItems(order)}\nTotal: ${formatINR(order.totalAmount)}\n\nView your order: ${orderUrl(order)}`,
  };
}

export function orderCancelledEmail(order, user) {
  return {
    subject: `Order cancelled - ${order.orderNumber}`,
    html: renderLayout({
      preheader: `Order ${order.orderNumber} has been cancelled.`,
      title: 'Your order has been cancelled',
      bodyHtml:
        p(`Hi ${escapeHtml(user.name)}, your order <strong>${escapeHtml(order.orderNumber)}</strong> has been cancelled.`) +
        (order.cancellationReason ? p(`<strong>Reason:</strong> ${escapeHtml(order.cancellationReason)}`) : '') +
        (order.refundNote ? p(`<strong>Refund:</strong> ${escapeHtml(order.refundNote)}`) : '') +
        orderMeta(order) +
        itemsTable(order),
      cta: { label: 'View Order', url: orderUrl(order) },
    }),
    text: `Hi ${user.name},\n\nYour order ${order.orderNumber} has been cancelled.${order.cancellationReason ? `\nReason: ${order.cancellationReason}` : ''}${order.refundNote ? `\nRefund: ${order.refundNote}` : ''}\n\nView your order: ${orderUrl(order)}`,
  };
}
