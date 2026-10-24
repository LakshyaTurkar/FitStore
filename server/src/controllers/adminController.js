import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { escapeRegex, toPositiveInt } from '../utils/helpers.js';
import { ORDER_STATUS, PAYMENT_STATUS } from '../config/constants.js';
import * as orderService from '../services/orderService.js';

/** GET /admin/dashboard */
export const dashboard = asyncHandler(async (req, res) => {
  const [totalProducts, totalOrders, totalUsers, revenueAgg, statusAgg, lowStock, recentOrders] = await Promise.all([
    Product.countDocuments(),
    Order.countDocuments(),
    User.countDocuments({ isDemoAccount: { $ne: true } }),
    // Revenue counts ONLY server-verified paid orders.
    Order.aggregate([
      { $match: { paymentStatus: PAYMENT_STATUS.PAID } },
      { $group: { _id: null, revenue: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
    ]),
    Order.aggregate([{ $group: { _id: '$orderStatus', count: { $sum: 1 } } }]),
    Product.find({ stock: { $lte: 5 } }).sort({ stock: 1 }).limit(8).select('name sku stock image'),
    Order.find().sort({ createdAt: -1 }).limit(6).populate('user', 'name email').select('orderNumber totalAmount paymentStatus orderStatus createdAt user'),
  ]);

  res.json({
    success: true,
    data: {
      totalProducts,
      totalOrders,
      totalUsers,
      paidOrders: revenueAgg[0]?.count || 0,
      revenue: revenueAgg[0]?.revenue || 0,
      ordersByStatus: Object.fromEntries(statusAgg.map((s) => [s._id, s.count])),
      lowStock,
      recentOrders,
    },
  });
});

/** GET /admin/orders?page&limit&status&paymentStatus&search */
export const listOrders = asyncHandler(async (req, res) => {
  const page = toPositiveInt(req.query.page, 1);
  const limit = toPositiveInt(req.query.limit, 15, 50);
  const filter = {};

  if (req.query.status) {
    if (!Object.values(ORDER_STATUS).includes(req.query.status)) throw ApiError.badRequest('Unknown order status filter.');
    filter.orderStatus = req.query.status;
  }
  if (req.query.paymentStatus) {
    if (!Object.values(PAYMENT_STATUS).includes(req.query.paymentStatus)) throw ApiError.badRequest('Unknown payment status filter.');
    filter.paymentStatus = req.query.paymentStatus;
  }
  const search = String(req.query.search || '').trim().slice(0, 80);
  if (search) {
    const rx = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ orderNumber: rx }, { 'shippingAddress.email': rx }, { 'shippingAddress.fullName': rx }];
  }

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('user', 'name email')
      .select('orderNumber user items totalAmount paymentStatus orderStatus createdAt shippingAddress.fullName'),
    Order.countDocuments(filter),
  ]);

  res.json({ success: true, data: orders, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

/** PATCH /admin/orders/:id/status  { status, note } */
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const status = String(req.body?.status || '');
  if (!Object.values(ORDER_STATUS).includes(status)) throw ApiError.badRequest('Unknown order status.');
  const order = await orderService.updateStatusByAdmin(req.params.id, status, req.body?.note);
  await order.populate('user', 'name email');
  res.json({ success: true, message: `Order marked as ${order.orderStatus}.`, data: orderService.serializeOrder(order, req.user) });
});
