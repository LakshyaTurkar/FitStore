import mongoose from 'mongoose';
import Product from '../models/Product.js';
import Review from '../models/Review.js';
import Order from '../models/Order.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { isValidObjectId, toPositiveInt } from '../utils/helpers.js';
import { validateReview } from '../utils/validators.js';
import { PAYMENT_STATUS } from '../config/constants.js';

/** Recalculates average rating and review count from the reviews collection. */
export async function recalculateRating(productId) {
  const [stats] = await Review.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(String(productId)) } },
    { $group: { _id: '$product', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  await Product.updateOne(
    { _id: productId },
    { $set: { rating: stats ? Math.round(stats.avg * 10) / 10 : 0, numReviews: stats?.count || 0 } },
  );
}

async function ensureProduct(id) {
  if (!isValidObjectId(id)) throw ApiError.notFound('Product not found.');
  const product = await Product.findById(id).select('_id name');
  if (!product) throw ApiError.notFound('Product not found.');
  return product;
}

/** GET /products/:id/reviews */
export const listReviews = asyncHandler(async (req, res) => {
  const product = await ensureProduct(req.params.id);
  const page = toPositiveInt(req.query.page, 1);
  const limit = toPositiveInt(req.query.limit, 10, 50);
  const [reviews, total] = await Promise.all([
    Review.find({ product: product._id }).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate('user', 'picture').lean(),
    Review.countDocuments({ product: product._id }),
  ]);
  res.json({
    success: true,
    data: reviews.map((r) => ({ ...r, user: { _id: r.user?._id, picture: r.user?.picture || '' } })),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

/** POST /products/:id/reviews (signed-in users, one review per product) */
export const createReview = asyncHandler(async (req, res) => {
  const product = await ensureProduct(req.params.id);
  const { rating, comment } = validateReview(req.body);

  if (await Review.exists({ product: product._id, user: req.user._id })) {
    throw ApiError.conflict('You have already reviewed this product.');
  }

  // Verified purchase is decided by the server from real paid orders.
  const verifiedPurchase = Boolean(
    await Order.exists({ user: req.user._id, 'items.product': product._id, paymentStatus: PAYMENT_STATUS.PAID }),
  );

  const review = await Review.create({
    product: product._id,
    user: req.user._id,
    name: req.user.name,
    rating,
    comment,
    verifiedPurchase,
  });
  await recalculateRating(product._id);

  res.status(201).json({ success: true, message: 'Thanks for your review!', data: review });
});
