import mongoose from 'mongoose';
import { ORDER_STATUS, PAYMENT_STATUS } from '../config/constants.js';

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    image: { type: String, required: true },
    sku: { type: String, required: true },
    mrp: { type: Number, required: true },
    unitPrice: { type: Number, required: true }, // price actually charged
    quantity: { type: Number, required: true, min: 1 },
    lineTotal: { type: Number, required: true },
  },
  { _id: false },
);

const shippingAddressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    line1: { type: String, required: true },
    line2: { type: String, default: '' },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
  },
  { _id: false },
);

const statusHistorySchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    note: { type: String, default: '' },
    changedBy: { type: String, enum: ['system', 'customer', 'admin'], default: 'system' },
    at: { type: Date, default: Date.now },
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: { type: [orderItemSchema], validate: (v) => v.length > 0 },
    shippingAddress: { type: shippingAddressSchema, required: true },

    subtotal: { type: Number, required: true },
    discount: { type: Number, required: true, default: 0 },
    shippingCharge: { type: Number, required: true, default: 0 },
    totalAmount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },

    paymentMethod: { type: String, default: 'Razorpay (Test Mode)' },
    paymentStatus: { type: String, enum: Object.values(PAYMENT_STATUS), default: PAYMENT_STATUS.PENDING, index: true },
    orderStatus: { type: String, enum: Object.values(ORDER_STATUS), default: ORDER_STATUS.PENDING_PAYMENT, index: true },

    razorpayOrderId: { type: String, index: { unique: true, sparse: true } },
    razorpayPaymentId: { type: String, default: null },
    razorpaySignature: { type: String, default: null },
    paymentVerifiedAt: { type: Date, default: null },
    paymentFailureReason: { type: String, default: null },
    paymentAttempts: { type: Number, default: 0 },

    // Guards against deducting inventory twice for the same order.
    stockDeducted: { type: Boolean, default: false },

    // Simulated (demo) fulfilment data - no real courier integration.
    demoTrackingNumber: { type: String, default: null },
    cancelledAt: { type: Date, default: null },
    cancellationReason: { type: String, default: null },
    refundNote: { type: String, default: null },

    statusHistory: { type: [statusHistorySchema], default: [] },
  },
  { timestamps: true },
);

orderSchema.index({ createdAt: -1 });

export default mongoose.model('Order', orderSchema);
