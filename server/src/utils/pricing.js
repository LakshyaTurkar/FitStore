import env from '../config/env.js';

/** The price a customer actually pays per unit (discount price if valid). */
export function effectiveUnitPrice({ price, discountPrice }) {
  if (typeof discountPrice === 'number' && discountPrice > 0 && discountPrice < price) {
    return discountPrice;
  }
  return price;
}

const round2 = (n) => Math.round(n * 100) / 100;

/**
 * Calculates order totals from trusted product data (never from the browser).
 * @param {Array<{price:number, discountPrice?:number, quantity:number}>} items
 * @returns {{ itemsCount, subtotal, discount, shippingCharge, total }}
 *   subtotal = sum of MRP x quantity, discount = savings from discount prices,
 *   total = subtotal - discount + shipping.
 */
export function calculateTotals(items, rules = {}) {
  const shippingRate = rules.shippingCharge ?? env.shippingCharge;
  const freeAbove = rules.freeShippingThreshold ?? env.freeShippingThreshold;

  let subtotal = 0;
  let discount = 0;
  let itemsCount = 0;

  for (const item of items) {
    const qty = Number(item.quantity) || 0;
    const unit = effectiveUnitPrice(item);
    subtotal += item.price * qty;
    discount += (item.price - unit) * qty;
    itemsCount += qty;
  }

  subtotal = round2(subtotal);
  discount = round2(discount);
  const afterDiscount = round2(subtotal - discount);
  const shippingCharge = itemsCount === 0 || afterDiscount >= freeAbove ? 0 : shippingRate;

  return {
    itemsCount,
    subtotal,
    discount,
    shippingCharge,
    total: round2(afterDiscount + shippingCharge),
  };
}

/** Razorpay expects the amount in the smallest unit (paise). */
export function toPaise(amountInRupees) {
  return Math.round(amountInRupees * 100);
}

export function shippingRules() {
  return { shippingCharge: env.shippingCharge, freeShippingThreshold: env.freeShippingThreshold };
}
