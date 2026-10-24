import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Review from '../models/Review.js';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { escapeRegex, isValidObjectId, slugify, toPositiveInt } from '../utils/helpers.js';
import { validateProduct } from '../utils/validators.js';

const SORTS = {
  newest: { createdAt: -1 },
  price_asc: { finalPrice: 1 },
  price_desc: { finalPrice: -1 },
  rating: { rating: -1, numReviews: -1 },
  popular: { soldCount: -1 },
  name: { name: 1 },
};

/**
 * GET /products
 * Query: page, limit, search, category (slug), minPrice, maxPrice,
 *        sort (newest|price_asc|price_desc|rating|popular|name), featured, inStock
 */
export const listProducts = asyncHandler(async (req, res) => {
  const page = toPositiveInt(req.query.page, 1);
  const limit = toPositiveInt(req.query.limit, 12, 48);
  const filter = {};

  const search = String(req.query.search || '').trim().slice(0, 80);
  if (search) {
    const rx = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ name: rx }, { description: rx }, { brand: rx }, { sku: rx }];
  }

  if (req.query.category) {
    const category = await Category.findOne({ slug: String(req.query.category).toLowerCase() });
    if (!category) {
      return res.json({ success: true, data: [], pagination: { page, limit, total: 0, pages: 0 } });
    }
    filter.category = category._id;
  }

  const minPrice = Number(req.query.minPrice);
  const maxPrice = Number(req.query.maxPrice);
  if (Number.isFinite(minPrice) && minPrice > 0) filter.finalPrice = { ...filter.finalPrice, $gte: minPrice };
  if (Number.isFinite(maxPrice) && maxPrice > 0) filter.finalPrice = { ...filter.finalPrice, $lte: maxPrice };
  if (req.query.featured === 'true') filter.featured = true;
  if (req.query.inStock === 'true') filter.stock = { $gt: 0 };

  const sort = SORTS[req.query.sort] || SORTS.newest;

  const [items, total] = await Promise.all([
    Product.find(filter)
      .sort({ ...sort, _id: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('category', 'name slug'),
    Product.countDocuments(filter),
  ]);

  res.json({ success: true, data: items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

async function findProductByIdOrSlug(idOrSlug) {
  const query = isValidObjectId(idOrSlug) ? { _id: idOrSlug } : { slug: String(idOrSlug).toLowerCase() };
  const product = await Product.findOne(query).populate('category', 'name slug');
  if (!product) throw ApiError.notFound('Product not found.');
  return product;
}

/** GET /products/:idOrSlug - includes a few related products. */
export const getProduct = asyncHandler(async (req, res) => {
  const product = await findProductByIdOrSlug(req.params.idOrSlug);
  const related = await Product.find({ category: product.category._id, _id: { $ne: product._id } })
    .sort({ soldCount: -1 })
    .limit(4)
    .populate('category', 'name slug');
  res.json({ success: true, data: { product, related } });
});

async function resolveCategory(categoryIdOrSlug) {
  const query = isValidObjectId(categoryIdOrSlug) ? { _id: categoryIdOrSlug } : { slug: categoryIdOrSlug };
  const category = await Category.findOne(query);
  if (!category) throw ApiError.badRequest('Please correct the product fields.', { category: 'Category does not exist.' });
  return category;
}

async function uniqueSlug(name, excludeId) {
  const base = slugify(name) || 'product';
  let slug = base;
  let n = 2;
  // eslint-disable-next-line no-await-in-loop
  while (await Product.exists({ slug, _id: { $ne: excludeId } })) {
    slug = `${base}-${n}`;
    n += 1;
  }
  return slug;
}

/** POST /products (admin) */
export const createProduct = asyncHandler(async (req, res) => {
  const data = validateProduct(req.body);
  const category = await resolveCategory(data.category);
  const product = new Product({ ...data, category: category._id, slug: await uniqueSlug(data.name) });
  await product.save();
  await product.populate('category', 'name slug');
  res.status(201).json({ success: true, message: 'Product created.', data: product });
});

/** PUT /products/:id (admin) */
export const updateProduct = asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.id)) throw ApiError.notFound('Product not found.');
  const product = await Product.findById(req.params.id);
  if (!product) throw ApiError.notFound('Product not found.');

  const data = validateProduct({ ...req.body, currentPrice: product.price }, { partial: true });
  if (data.category) data.category = (await resolveCategory(data.category))._id;
  if (data.name && data.name !== product.name) data.slug = await uniqueSlug(data.name, product._id);

  product.set(data);
  await product.save(); // runs validators and recalculates finalPrice
  await product.populate('category', 'name slug');
  res.json({ success: true, message: 'Product updated.', data: product });
});

/** DELETE /products/:id (admin). Past orders keep their product snapshots. */
export const deleteProduct = asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.id)) throw ApiError.notFound('Product not found.');
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) throw ApiError.notFound('Product not found.');
  await Promise.all([
    Review.deleteMany({ product: product._id }),
    User.updateMany({ 'cart.product': product._id }, { $pull: { cart: { product: product._id } } }),
  ]);
  res.json({ success: true, message: 'Product deleted.' });
});
