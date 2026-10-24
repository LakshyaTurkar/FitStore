import mongoose from 'mongoose';

/**
 * One document per logical email (e.g. "order-confirmed:<orderId>").
 * The unique key makes sending idempotent across retries and repeated requests.
 */
const emailEventSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    type: { type: String, required: true },
    status: { type: String, enum: ['sending', 'sent', 'failed', 'skipped'], default: 'sending' },
    attempts: { type: Number, default: 1 },
    providerId: { type: String, default: null },
    lastError: { type: String, default: null },
    sentAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export default mongoose.model('EmailEvent', emailEventSchema);
