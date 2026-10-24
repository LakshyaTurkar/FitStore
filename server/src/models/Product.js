import mongoose from 'mongoose';
import { effectiveUnitPrice } from '../utils/pricing.js';

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, required: true, maxlength: 3000 },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    brand: { type: String, default: 'FitStore', trim: true },
    price: { type: Number, required: true, min: 1 }, // MRP in INR
    discountPrice: {
      type: Number,
      default: null,
      validate: {
        validator(value) {
          return value === null || value === undefined || (value > 0 && value < this.price);
        },
        message: 'Discount price must be lower than the price.',
      },
    },
    // Denormalised selling price - makes price filters and sorting simple.
    finalPrice: { type: Number, index: true },
    image: { type: String, required: true },
    stock: { type: Number, required: true, min: 0, default: 0 },
    sku: { type: String, required: true, unique: true, uppercase: true, trim: true },
    featured: { type: Boolean, default: false, index: true },
    soldCount: { type: Number, default: 0, min: 0 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    numReviews: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

productSchema.pre('save', function setFinalPrice(next) {
  this.finalPrice = effectiveUnitPrice(this);
  next();
});

productSchema.virtual('discountPercent').get(function discountPercent() {
  if (!this.discountPrice || this.discountPrice >= this.price) return 0;
  return Math.round(((this.price - this.discountPrice) / this.price) * 100);
});

productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

export default mongoose.model('Product', productSchema);
