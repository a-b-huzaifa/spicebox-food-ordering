import mongoose, { Document, Model, Schema, Types, model } from 'mongoose';
import type { MenuItemDTO } from '../types';

export interface IMenuItem {
  restaurant: Types.ObjectId;
  name: string;
  description: string;
  price: number; // integer rupees
  image: string;
  section: string;
  isAvailable: boolean;
  isVeg: boolean;
  prepTimeMinutes?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMenuItemMethods {
  toDTO(): MenuItemDTO;
}

export type MenuItemDocument = Document<Types.ObjectId, {}, IMenuItem> &
  IMenuItem &
  IMenuItemMethods;

export type MenuItemModel = Model<IMenuItem, {}, IMenuItemMethods>;

const menuItemSchema = new Schema<IMenuItem, MenuItemModel, IMenuItemMethods>(
  {
    restaurant: {
      type: Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: [true, 'Restaurant reference is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Menu item name is required'],
      trim: true,
      maxlength: [120, 'Name cannot exceed 120 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
      validate: {
        validator: Number.isInteger,
        message: 'Price must be an integer in rupees',
      },
    },
    image: {
      type: String,
      required: [true, 'Image URL is required'],
      trim: true,
    },
    section: {
      type: String,
      required: [true, 'Menu section is required'],
      trim: true,
    },
    isAvailable: {
      type: Boolean,
      default: true,
      index: true,
    },
    isVeg: {
      type: Boolean,
      default: false,
    },
    prepTimeMinutes: {
      type: Number,
      min: [1, 'Preparation time must be at least 1 minute'],
    },
  },
  {
    timestamps: true,
  },
);

menuItemSchema.index({ restaurant: 1, section: 1 });
menuItemSchema.index({ restaurant: 1, isAvailable: 1 });

menuItemSchema.methods.toDTO = function (this: MenuItemDocument): MenuItemDTO {
  const id = this._id.toString();
  return {
    id,
    _id: id,
    restaurant: this.restaurant.toString(),
    name: this.name,
    description: this.description,
    price: this.price,
    image: this.image,
    section: this.section,
    isAvailable: this.isAvailable,
    isVeg: this.isVeg,
    ...(this.prepTimeMinutes !== undefined ? { prepTimeMinutes: this.prepTimeMinutes } : {}),
    createdAt: this.createdAt ? this.createdAt.toISOString() : new Date().toISOString(),
    updatedAt: this.updatedAt ? this.updatedAt.toISOString() : new Date().toISOString(),
  };
};

export const MenuItem: MenuItemModel =
  (mongoose.models.MenuItem as MenuItemModel) ||
  model<IMenuItem, MenuItemModel>('MenuItem', menuItemSchema);

export default MenuItem;

