import mongoose, { Document, Model, Schema, Types, model } from 'mongoose';
import {
  ORDER_STATUSES,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  type DeliveryAddressSnapshot,
  type OrderDTO,
  type OrderStatus,
  type PaymentMethod,
  type PaymentStatus,
} from '../types';

export interface IOrderItem {
  menuItem: Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
}

export interface IStatusHistory {
  status: OrderStatus;
  at: Date;
  by: Types.ObjectId;
}

export interface IOrder {
  customer: Types.ObjectId;
  restaurant: Types.ObjectId;
  items: Types.DocumentArray<IOrderItem> | IOrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  deliveryAddress: DeliveryAddressSnapshot;
  notes?: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  statusHistory: Types.DocumentArray<IStatusHistory> | IStatusHistory[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IOrderMethods {
  toDTO(): OrderDTO;
}

export type OrderDocument = Document<Types.ObjectId, {}, IOrder> & IOrder & IOrderMethods;

export type OrderModel = Model<IOrder, {}, IOrderMethods>;

const orderItemSchema = new Schema<IOrderItem>(
  {
    menuItem: {
      type: Schema.Types.ObjectId,
      ref: 'MenuItem',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  { _id: false },
);

const deliveryAddressSchema = new Schema<DeliveryAddressSnapshot>(
  {
    label: {
      type: String,
      required: true,
      trim: true,
    },
    line1: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  { _id: false },
);

const statusHistorySchema = new Schema<IStatusHistory>(
  {
    status: {
      type: String,
      enum: ORDER_STATUSES,
      required: true,
    },
    at: {
      type: Date,
      default: () => new Date(),
      required: true,
    },
    by: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { _id: false },
);

const orderSchema = new Schema<IOrder, OrderModel, IOrderMethods>(
  {
    customer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Customer is required'],
      index: true,
    },
    restaurant: {
      type: Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: [true, 'Restaurant is required'],
      index: true,
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (items: IOrderItem[]) => Array.isArray(items) && items.length > 0,
        message: 'Order must contain at least one item',
      },
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    deliveryFee: {
      type: Number,
      required: true,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    deliveryAddress: {
      type: deliveryAddressSchema,
      required: [true, 'Delivery address snapshot is required'],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
    status: {
      type: String,
      enum: {
        values: ORDER_STATUSES,
        message: 'Invalid order status: {VALUE}',
      },
      default: 'pending',
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: {
        values: PAYMENT_METHODS,
        message: 'Invalid payment method: {VALUE}',
      },
      required: [true, 'Payment method is required'],
    },
    paymentStatus: {
      type: String,
      enum: {
        values: PAYMENT_STATUSES,
        message: 'Invalid payment status: {VALUE}',
      },
      default: 'unpaid',
      index: true,
    },
    statusHistory: {
      type: [statusHistorySchema],
      default: () => [],
    },
  },
  {
    timestamps: true,
  },
);

orderSchema.index({ customer: 1, createdAt: -1 });
orderSchema.index({ restaurant: 1, createdAt: -1 });

orderSchema.methods.toDTO = function (this: OrderDocument): OrderDTO {
  const id = this._id.toString();
  return {
    id,
    _id: id,
    customer: this.customer.toString(),
    restaurant: this.restaurant.toString(),
    items: (this.items ?? []).map((item) => ({
      menuItem: item.menuItem.toString(),
      name: item.name,
      price: item.price,
      quantity: item.quantity,
    })),
    subtotal: this.subtotal,
    deliveryFee: this.deliveryFee,
    total: this.total,
    deliveryAddress: {
      label: this.deliveryAddress.label,
      line1: this.deliveryAddress.line1,
      city: this.deliveryAddress.city,
      ...(this.deliveryAddress.notes !== undefined ? { notes: this.deliveryAddress.notes } : {}),
    },
    ...(this.notes ? { notes: this.notes } : {}),
    status: this.status,
    paymentMethod: this.paymentMethod,
    paymentStatus: this.paymentStatus,
    statusHistory: (this.statusHistory ?? []).map((entry) => ({
      status: entry.status,
      at: entry.at ? entry.at.toISOString() : new Date().toISOString(),
      by: entry.by.toString(),
    })),
    createdAt: this.createdAt ? this.createdAt.toISOString() : new Date().toISOString(),
    updatedAt: this.updatedAt ? this.updatedAt.toISOString() : new Date().toISOString(),
  };
};

export const Order: OrderModel =
  (mongoose.models.Order as OrderModel) || model<IOrder, OrderModel>('Order', orderSchema);

export default Order;

