import mongoose, { Document, Model, Schema, Types, model } from 'mongoose';
import {
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  type PaymentDTO,
  type PaymentMethod,
  type PaymentStatus,
} from '../types';

export interface IPayment {
  order: Types.ObjectId;
  method: PaymentMethod;
  amount: number;
  status: PaymentStatus;
  provider: string;
  providerRef?: string;
  paidAt?: Date;
  failureReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPaymentMethods {
  toDTO(): PaymentDTO;
}

export type PaymentDocument = Document<Types.ObjectId, {}, IPayment> &
  IPayment &
  IPaymentMethods;

export type PaymentModel = Model<IPayment, {}, IPaymentMethods>;

const paymentSchema = new Schema<IPayment, PaymentModel, IPaymentMethods>(
  {
    order: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: [true, 'Order reference is required'],
      unique: true,
      index: true,
    },
    method: {
      type: String,
      enum: {
        values: PAYMENT_METHODS,
        message: 'Invalid payment method: {VALUE}',
      },
      required: [true, 'Payment method is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    status: {
      type: String,
      enum: {
        values: PAYMENT_STATUSES,
        message: 'Invalid payment status: {VALUE}',
      },
      default: 'unpaid',
      index: true,
    },
    provider: {
      type: String,
      required: [true, 'Payment provider is required'],
      trim: true,
    },
    providerRef: {
      type: String,
      trim: true,
    },
    paidAt: {
      type: Date,
    },
    failureReason: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

paymentSchema.methods.toDTO = function (this: PaymentDocument): PaymentDTO {
  const id = this._id.toString();
  return {
    id,
    _id: id,
    order: this.order.toString(),
    method: this.method,
    amount: this.amount,
    status: this.status,
    provider: this.provider,
    ...(this.providerRef ? { providerRef: this.providerRef } : {}),
    ...(this.paidAt ? { paidAt: this.paidAt.toISOString() } : {}),
    ...(this.failureReason ? { failureReason: this.failureReason } : {}),
    createdAt: this.createdAt ? this.createdAt.toISOString() : new Date().toISOString(),
    updatedAt: this.updatedAt ? this.updatedAt.toISOString() : new Date().toISOString(),
  };
};

export const Payment: PaymentModel =
  (mongoose.models.Payment as PaymentModel) ||
  model<IPayment, PaymentModel>('Payment', paymentSchema);

export default Payment;

