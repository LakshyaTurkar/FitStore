import ApiError from './ApiError.js';

const clean = (v) => (typeof v === 'string' ? v.trim() : '');

const INDIAN_MOBILE = /^[6-9]\d{9}$/;
const PINCODE = /^[1-9]\d{5}$/;

/** Validates a delivery address. Returns a cleaned copy or throws a 400 with field errors. */
export function validateAddress(input = {}) {
  const address = {
    fullName: clean(input.fullName),
    phone: clean(input.phone).replace(/[\s-]/g, '').replace(/^\+91/, ''),
    line1: clean(input.line1),
    line2: clean(input.line2),
    city: clean(input.city),
    state: clean(input.state),
    pincode: clean(input.pincode),
  };

  const errors = {};
  if (address.fullName.length < 2 || address.fullName.length > 80) errors.fullName = 'Full name must be 2-80 characters.';
  if (!INDIAN_MOBILE.test(address.phone)) errors.phone = 'Enter a valid 10-digit Indian mobile number.';
  if (address.line1.length < 5 || address.line1.length > 150) errors.line1 = 'Address must be 5-150 characters.';
  if (address.line2.length > 150) errors.line2 = 'Address line 2 must be at most 150 characters.';
  if (address.city.length < 2 || address.city.length > 60) errors.city = 'City must be 2-60 characters.';
  if (address.state.length < 2 || address.state.length > 60) errors.state = 'State must be 2-60 characters.';
  if (!PINCODE.test(address.pincode)) errors.pincode = 'Enter a valid 6-digit PIN code.';

  if (Object.keys(errors).length) throw ApiError.badRequest('Please correct the highlighted address fields.', errors);
  return address;
}

const isHttpUrl = (value) => {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
};

/** Validates product create/update payloads coming from the admin panel. */
export function validateProduct(input = {}, { partial = false } = {}) {
  const errors = {};
  const out = {};
  const has = (key) => input[key] !== undefined;

  if (!partial || has('name')) {
    out.name = clean(input.name);
    if (out.name.length < 3 || out.name.length > 120) errors.name = 'Name must be 3-120 characters.';
  }
  if (!partial || has('description')) {
    out.description = clean(input.description);
    if (out.description.length < 20 || out.description.length > 3000) errors.description = 'Description must be 20-3000 characters.';
  }
  if (!partial || has('category')) {
    out.category = clean(input.category);
    if (!out.category) errors.category = 'Category is required.';
  }
  if (!partial || has('price')) {
    out.price = Number(input.price);
    if (!Number.isFinite(out.price) || out.price <= 0 || out.price > 1000000) errors.price = 'Price must be between 1 and 10,00,000.';
  }
  if (has('discountPrice')) {
    if (input.discountPrice === null || input.discountPrice === '') {
      out.discountPrice = null;
    } else {
      out.discountPrice = Number(input.discountPrice);
      if (!Number.isFinite(out.discountPrice) || out.discountPrice <= 0) errors.discountPrice = 'Discount price must be a positive number.';
    }
  }
  if (!partial || has('image')) {
    out.image = clean(input.image);
    if (!isHttpUrl(out.image)) errors.image = 'Image must be a valid http(s) URL.';
  }
  if (!partial || has('stock')) {
    out.stock = Number(input.stock);
    if (!Number.isInteger(out.stock) || out.stock < 0 || out.stock > 100000) errors.stock = 'Stock must be a whole number between 0 and 100000.';
  }
  if (!partial || has('sku')) {
    out.sku = clean(input.sku).toUpperCase();
    if (!/^[A-Z0-9-]{3,30}$/.test(out.sku)) errors.sku = 'SKU must be 3-30 characters (letters, numbers, hyphens).';
  }
  if (has('brand')) out.brand = clean(input.brand).slice(0, 60);
  if (has('featured')) out.featured = Boolean(input.featured);

  const price = out.price ?? input.currentPrice;
  if (out.discountPrice && price && out.discountPrice >= price) {
    errors.discountPrice = 'Discount price must be lower than the price.';
  }

  if (Object.keys(errors).length) throw ApiError.badRequest('Please correct the product fields.', errors);
  return out;
}

export function validateReview(input = {}) {
  const rating = Number(input.rating);
  const comment = clean(input.comment);
  const errors = {};
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) errors.rating = 'Rating must be a whole number from 1 to 5.';
  if (comment.length < 10 || comment.length > 1000) errors.comment = 'Review must be 10-1000 characters.';
  if (Object.keys(errors).length) throw ApiError.badRequest('Please correct your review.', errors);
  return { rating, comment };
}
