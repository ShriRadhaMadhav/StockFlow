import mongoose, { Document, Schema } from 'mongoose';

export interface IInvoiceItem {
  productId: mongoose.Types.ObjectId;
  quantity: number;
  sellingPrice: number;
  subtotal: number;
}

export interface IInvoice extends Document {
  businessId: mongoose.Types.ObjectId;
  customerId: mongoose.Types.ObjectId;
  invoiceNumber: string;
  items: IInvoiceItem[];
  subtotal: number;
  taxPercentage: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  workflowState: 'draft' | 'finalized' | 'cancelled';
  paymentStatus: 'paid' | 'pending' | 'partial' | 'overdue';
  paymentTerms: string;
  dueDate: Date;
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  isArchived: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const invoiceItemSchema = new Schema<IInvoiceItem>({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true },
  sellingPrice: { type: Number, required: true },
  subtotal: { type: Number, required: true },
}, { _id: false });

const invoiceSchema = new Schema<IInvoice>({
  businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true },
  customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
  invoiceNumber: { type: String, required: true, unique: true },
  items: [invoiceItemSchema],
  subtotal: { type: Number, required: true },
  taxPercentage: { type: Number, default: 0 },
  taxAmount: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  total: { type: Number, required: true },
  workflowState: { type: String, enum: ['draft', 'finalized', 'cancelled'], default: 'draft' },
  paymentStatus: { type: String, enum: ['paid', 'pending', 'partial', 'overdue'], default: 'pending' },
  paymentTerms: { type: String, default: 'Net 30' },
  dueDate: { type: Date, required: true },
  notes: { type: String },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  isArchived: { type: Boolean, default: false },
  deletedAt: { type: Date },
}, { timestamps: true });

invoiceSchema.index({ businessId: 1, isArchived: 1, createdAt: -1 });
invoiceSchema.index({ businessId: 1, workflowState: 1, isArchived: 1 });
invoiceSchema.index({ businessId: 1, paymentStatus: 1, isArchived: 1 });
invoiceSchema.index({ businessId: 1, customerId: 1 });

export const Invoice = mongoose.model<IInvoice>('Invoice', invoiceSchema);
