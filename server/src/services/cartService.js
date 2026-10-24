import Product from '../models/Product.js';
import { calculateTotals, effectiveUnitPrice, shippingRules } from '../utils/pricing.js';

/**
 * Builds the cart response from the user's embedded cart and CURRENT product
 * data. Removes products that no longer exist and flags stock problems.
 */
export async function buildCartView(user) {
  const ids = user.cart.map((item) => item.product);
  const products = await Product.find({ _id: { $in: ids } })
    .select('name slug image price discountPrice finalPrice stock sku')
    .populate('category', 'name slug');
  const byId = new Map(products.map((p) => [String(p._id), p]));

  const stillExists = user.cart.filter((item) => byId.has(String(item.product)));
  if (stillExists.length !== user.cart.length) {
    user.cart = stillExists;
    await user.save();
  }

  const items = stillExists.map((item) => {
    const product = byId.get(String(item.product));
    const unitPrice = effectiveUnitPrice(product);
    return {
      product: {
        _id: product._id,
        name: product.name,
        slug: product.slug,
        image: product.image,
        sku: product.sku,
        price: product.price,
        discountPrice: product.discountPrice,
        stock: product.stock,
        category: product.category,
      },
      quantity: item.quantity,
      unitPrice,
      lineTotal: Math.round(unitPrice * item.quantity * 100) / 100,
      stockIssue: product.stock < item.quantity ? (product.stock === 0 ? 'Out of stock' : `Only ${product.stock} left`) : null,
    };
  });

  const totals = calculateTotals(
    items.map((i) => ({ price: i.product.price, discountPrice: i.product.discountPrice, quantity: i.quantity })),
  );

  return {
    items,
    totals,
    rules: shippingRules(),
    hasStockIssues: items.some((i) => i.stockIssue),
  };
}
