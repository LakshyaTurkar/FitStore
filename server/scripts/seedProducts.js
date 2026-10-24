/**
 * Seeds categories, products and DEMO reviews.
 * Usage:  npm run seed
 * WARNING: replaces all categories, products and reviews and empties carts.
 * Users and orders are kept (orders store product snapshots).
 */
import mongoose from 'mongoose';
import env from '../src/config/env.js';
import { connectDB } from '../src/config/db.js';
import Category from '../src/models/Category.js';
import Product from '../src/models/Product.js';
import Review from '../src/models/Review.js';
import User from '../src/models/User.js';
import { recalculateRating } from '../src/controllers/reviewController.js';
import { slugify } from '../src/utils/helpers.js';
import { categories, demoReviewers, demoReviews, products } from './seedData.js';

async function seed() {
  if (!env.mongoUri) throw new Error('MONGODB_URI is not set in server/.env');
  await connectDB();

  console.log('[seed] Clearing categories, products, reviews and carts...');
  await Promise.all([Category.deleteMany({}), Product.deleteMany({}), Review.deleteMany({})]);
  await User.updateMany({}, { $set: { cart: [] } });

  const createdCategories = await Category.insertMany(categories);
  const categoryBySlug = new Map(createdCategories.map((c) => [c.slug, c._id]));
  console.log(`[seed] ${createdCategories.length} categories created.`);

  // Product.create (not insertMany) so the pre-save hook sets finalPrice.
  const createdProducts = await Product.create(
    products.map((p) => ({ ...p, slug: slugify(p.name), category: categoryBySlug.get(p.category) })),
  );
  console.log(`[seed] ${createdProducts.length} products created.`);

  const reviewers = [];
  for (const r of demoReviewers) {
    // eslint-disable-next-line no-await-in-loop
    const user = await User.findOneAndUpdate(
      { googleId: r.googleId },
      { $set: { ...r, isDemoAccount: true, role: 'user' } },
      { upsert: true, new: true },
    );
    reviewers.push(user);
  }

  const productBySku = new Map(createdProducts.map((p) => [p.sku, p]));
  await Review.insertMany(
    demoReviews.map(([sku, reviewerIndex, rating, comment]) => ({
      product: productBySku.get(sku)._id,
      user: reviewers[reviewerIndex]._id,
      name: reviewers[reviewerIndex].name,
      rating,
      comment,
      isDemo: true,
    })),
  );
  for (const sku of new Set(demoReviews.map(([s]) => s))) {
    // eslint-disable-next-line no-await-in-loop
    await recalculateRating(productBySku.get(sku)._id);
  }
  console.log(`[seed] ${demoReviews.length} demo reviews created.`);
  console.log('[seed] Done.');
}

seed()
  .catch((err) => {
    console.error('[seed] Failed:', err.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
