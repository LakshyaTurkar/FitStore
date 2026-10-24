export const ROLES = Object.freeze({ USER: 'user', ADMIN: 'admin' });

export const ORDER_STATUS = Object.freeze({
  PENDING_PAYMENT: 'Pending Payment',
  CONFIRMED: 'Confirmed',
  PROCESSING: 'Processing',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
});

export const PAYMENT_STATUS = Object.freeze({
  PENDING: 'Pending',
  PAID: 'Paid',
  FAILED: 'Failed',
  REFUNDED: 'Refunded',
});

/**
 * Allowed order status transitions that an ADMIN may perform.
 * "Pending Payment" -> "Confirmed" is intentionally missing: only a
 * server-verified payment can confirm an order.
 */
export const ADMIN_STATUS_TRANSITIONS = Object.freeze({
  [ORDER_STATUS.PENDING_PAYMENT]: [ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.CONFIRMED]: [ORDER_STATUS.PROCESSING, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.PROCESSING]: [ORDER_STATUS.SHIPPED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.SHIPPED]: [ORDER_STATUS.DELIVERED],
  [ORDER_STATUS.DELIVERED]: [],
  [ORDER_STATUS.CANCELLED]: [],
});

/** Statuses from which a CUSTOMER may cancel their own order. */
export const CUSTOMER_CANCELLABLE = Object.freeze([ORDER_STATUS.PENDING_PAYMENT, ORDER_STATUS.CONFIRMED]);

export const MAX_QTY_PER_ITEM = 10;
export const MAX_SAVED_ADDRESSES = 5;
export const AUTH_COOKIE = 'fitstore_token';
