import mongoose, { Document, Model, Schema, Types, model } from 'mongoose';
import { RESTAURANT_STATUSES, type RestaurantDTO, type RestaurantStatus } from '../types';

export interface IRestaurantEtaMinutes {
  min: number;
  max: number;
}

export interface IRestaurant {
  owner: Types.ObjectId;
  name: string;
  slug: string;
  description: string;
  cuisine: string;
  categories: string[];
  image: string;
  address: string;
  phone: string;
  deliveryFee: number;
  minOrder: number;
  etaMinutes: IRestaurantEtaMinutes;
  isOpen: boolean;
  status: RestaurantStatus;
  ratingAverage: number;
  ratingCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRestaurantMethods {
  toDTO(): RestaurantDTO;
}

export type RestaurantDocument = Document<Types.ObjectId, {}, IRestaurant> &
  IRestaurant &
  IRestaurantMethods;

export type RestaurantModel = Model<IRestaurant, {}, IRestaurantMethods>;

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

const etaMinutesSchema = new Schema<IRestaurantEtaMinutes>(
  {
    min: {
      type: Number,
      required: [true, 'Minimum ETA minutes is required'],
      min: [1, 'Minimum ETA must be at least 1 minute'],
    },
    max: {
      type: Number,
      required: [true, 'Maximum ETA minutes is required'],
      min: [1, 'Maximum ETA must be at least 1 minute'],
    },
  },
  { _id: false },
);

const restaurantSchema = new Schema<IRestaurant, RestaurantModel, IRestaurantMethods>(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owner is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Restaurant name is required'],
      trim: true,
      maxlength: [120, 'Name cannot exceed 120 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    cuisine: {
      type: String,
      required: [true, 'Cuisine is required'],
      trim: true,
    },
    categories: {
      type: [String],
      default: () => [],
    },
    image: {
      type: String,
      required: [true, 'Image URL is required'],
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    deliveryFee: {
      type: Number,
      required: [true, 'Delivery fee is required'],
      min: [0, 'Delivery fee cannot be negative'],
      default: 0,
    },
    minOrder: {
      type: Number,
      required: [true, 'Minimum order amount is required'],
      min: [0, 'Minimum order cannot be negative'],
      default: 0,
    },
    etaMinutes: {
      type: etaMinutesSchema,
      required: [true, 'ETA minutes is required'],
    },
    isOpen: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: {
        values: RESTAURANT_STATUSES,
        message: 'Invalid status: {VALUE}',
      },
      default: 'pending',
      index: true,
    },
    ratingAverage: {
      type: Number,
      min: [0, 'Rating cannot be less than 0'],
      max: [5, 'Rating cannot exceed 5'],
      default: 0,
    },
    ratingCount: {
      type: Number,
      min: [0, 'Rating count cannot be negative'],
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

// Compound queries optimization
restaurantSchema.index({ status: 1, cuisine: 1 });
restaurantSchema.index({ status: 1, ratingAverage: -1 });

// Automatically compute slug if missing before validation
restaurantSchema.pre('validate', function () {
  if (!this.slug && this.name) {
    this.slug = slugify(this.name);
  }
});

restaurantSchema.methods.toDTO = function (this: RestaurantDocument): RestaurantDTO {
  const id = this._id.toString();
  return {
    id,
    _id: id,
    owner: this.owner.toString(),
    name: this.name,
    slug: this.slug,
    description: this.description,
    cuisine: this.cuisine,
    categories: [...(this.categories ?? [])],
    image: this.image,
    address: this.address,
    phone: this.phone,
    deliveryFee: this.deliveryFee,
    minOrder: this.minOrder,
    etaMinutes: {
      min: this.etaMinutes.min,
      max: this.etaMinutes.max,
    },
    isOpen: this.isOpen,
    status: this.status,
    ratingAverage: this.ratingAverage,
    ratingCount: this.ratingCount,
    createdAt: this.createdAt ? this.createdAt.toISOString() : new Date().toISOString(),
    updatedAt: this.updatedAt ? this.updatedAt.toISOString() : new Date().toISOString(),
  };
};

export const Restaurant: RestaurantModel =
  (mongoose.models.Restaurant as RestaurantModel) ||
  model<IRestaurant, RestaurantModel>('Restaurant', restaurantSchema);

export default Restaurant;

