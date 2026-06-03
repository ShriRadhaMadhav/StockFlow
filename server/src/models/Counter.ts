import mongoose, { Document, Schema } from 'mongoose';

export interface ICounter extends Document {
  businessId: mongoose.Types.ObjectId;
  id: string; // The counter identifier, e.g., 'invoice_seq'
  seq: number;
}

const counterSchema = new Schema<ICounter>({
  businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true },
  id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

counterSchema.index({ businessId: 1, id: 1 }, { unique: true });

export const Counter = mongoose.model<ICounter>('Counter', counterSchema);
