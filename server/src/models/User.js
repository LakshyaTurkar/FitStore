import mongoose from 'mongoose';
import { MAX_QTY_PER_ITEM, ROLES } from '../config/constants.js';

const addressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    line1: { type: String, required: true, trim: true },
    line2: { type: String, trim: true, default: '' },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
  },
  { _id: true },
);

// The cart is embedded in the user document: one read gives the whole cart,
// it survives refreshes/devices, and there is no separate collection to sync.
const cartItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1, max: MAX_QTY_PER_ITEM },
  },
  { _id: false },
);

const userSchema = new mongoose.Schema(
  {
    googleId: { type: String, required: true, unique: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    picture: { type: String, default: '' },
    // Role can only be changed by the promoteAdmin script / direct DB access.
    role: { type: String, enum: Object.values(ROLES), default: ROLES.USER },
    addresses: { type: [addressSchema], default: [] },
    cart: { type: [cartItemSchema], default: [] },
    isDemoAccount: { type: Boolean, default: false },
    lastLoginAt: Date,
  },
  { timestamps: true },
);

/** Only these fields are ever sent to the browser. */
userSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    picture: this.picture,
    role: this.role,
    createdAt: this.createdAt,
  };
};

export default mongoose.model('User', userSchema);
