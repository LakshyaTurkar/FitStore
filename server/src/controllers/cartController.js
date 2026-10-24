import Product from '../models/Product.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { isValidObjectId } from '../utils/helpers.js';
import { buildCartView } from '../services/cartService.js';
import { MAX_QTY_PER_ITEM } from '../config/constants.js';

function parseQuantity(value) {
  const qty = Number(value);
  if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QTY_PER_ITEM) {
    throw ApiError.badRequest(`Quantity must be a whole number between 1 and ${MAX_QTY_PER_ITEM}.`);
  }
  return qty;
}

async function loadProduct(productId) {
  if (!isValidObjectId(productId)) throw ApiError.notFound('Product not found.');
  const product = await Product.findById(productId).select('name stock');
  if (!product) throw ApiError.notFound('Product not found.');
  return product;
}

function assertStock(product, quantity) {
  if (product.stock === 0) throw ApiError.badRequest(`${product.name} is out of stock.`);
  if (quantity > product.stock) throw ApiError.badRequest(`Only ${product.stock} unit(s) of ${product.name} available.`);
}

/** GET /cart */
export const getCart = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await buildCartView(req.user) });
});

/** POST /cart/items  { productId, quantity } - adds to any existing quantity. */
export const addItem = asyncHandler(async (req, res) => {
  const quantity = parseQuantity(req.body?.quantity ?? 1);
  const product = await loadProduct(req.body?.productId);

  const existing = req.user.cart.find((item) => String(item.product) === String(product._id));
  const newQty = (existing?.quantity || 0) + quantity;
  if (newQty > MAX_QTY_PER_ITEM) throw ApiError.badRequest(`You can buy at most ${MAX_QTY_PER_ITEM} of each product.`);
  assertStock(product, newQty);

  if (existing) existing.quantity = newQty;
  else req.user.cart.push({ product: product._id, quantity });
  await req.user.save();

  res.status(201).json({ success: true, message: `${product.name} added to cart.`, data: await buildCartView(req.user) });
});

/** PATCH /cart/items/:productId  { quantity } - sets an exact quantity. */
export const updateItem = asyncHandler(async (req, res) => {
  const quantity = parseQuantity(req.body?.quantity);
  const product = await loadProduct(req.params.productId);
  const existing = req.user.cart.find((item) => String(item.product) === String(product._id));
  if (!existing) throw ApiError.notFound('This product is not in your cart.');
  assertStock(product, quantity);

  existing.quantity = quantity;
  await req.user.save();
  res.json({ success: true, data: await buildCartView(req.user) });
});

/** DELETE /cart/items/:productId */
export const removeItem = asyncHandler(async (req, res) => {
  const before = req.user.cart.length;
  req.user.cart = req.user.cart.filter((item) => String(item.product) !== String(req.params.productId));
  if (req.user.cart.length === before) throw ApiError.notFound('This product is not in your cart.');
  await req.user.save();
  res.json({ success: true, message: 'Item removed.', data: await buildCartView(req.user) });
});

/** DELETE /cart */
export const clearCart = asyncHandler(async (req, res) => {
  req.user.cart = [];
  await req.user.save();
  res.json({ success: true, message: 'Cart cleared.', data: await buildCartView(req.user) });
});
