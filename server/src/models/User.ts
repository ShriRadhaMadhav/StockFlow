import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  businessId: mongoose.Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: 'owner' | 'manager' | 'cashier';
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>({
  businessId: { type: Schema.Types.ObjectId, ref: 'Business' },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['owner', 'manager', 'cashier'], default: 'cashier' },
}, { timestamps: true });

export const User = mongoose.model<IUser>('User', userSchema);
