import bcrypt from 'bcryptjs';
import mongoose, { Document, Model, Schema, Types, model } from 'mongoose';
import { ROLES, type PublicUser, type Role, type UserAddress } from '../types';

export interface IUserAddress {
  _id: Types.ObjectId;
  label: string;
  line1: string;
  city: string;
  notes?: string;
  isDefault: boolean;
}

export interface IUser {
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  phone?: string;
  isActive: boolean;
  addresses: Types.DocumentArray<IUserAddress>;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserMethods {
  comparePassword(candidate: string): Promise<boolean>;
  toPublic(): PublicUser;
}

export type UserDocument = Document<Types.ObjectId, {}, IUser> & IUser & IUserMethods;

export type UserModel = Model<IUser, {}, IUserMethods>;

const addressSchema = new Schema<IUserAddress>(
  {
    label: {
      type: String,
      required: [true, 'Address label is required'],
      trim: true,
    },
    line1: {
      type: String,
      required: [true, 'Address line 1 is required'],
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    _id: true,
    timestamps: false,
  },
);

const userSchema = new Schema<IUser, UserModel, IUserMethods>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
      select: false,
    },
    role: {
      type: String,
      enum: {
        values: ROLES,
        message: 'Invalid role: {VALUE}',
      },
      default: 'customer',
    },
    phone: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    addresses: {
      type: [addressSchema],
      default: () => [],
    },
  },
  {
    timestamps: true,
  },
);

// Indexes
userSchema.index({ role: 1 });
userSchema.index({ role: 1, isActive: 1 });

const BCRYPT_ROUNDS = 10;
const BCRYPT_HASH_REGEX = /^\$2[abxy]\$\d{2}\$[./A-Za-z0-9]{53}$/;

// Allow assigning plain password via virtual helper
userSchema.virtual('password').set(function (this: UserDocument, plainText: string) {
  this.passwordHash = plainText;
});

// Hash password on save whenever passwordHash was modified
userSchema.pre('save', async function () {
  if (!this.isModified('passwordHash')) {
    return;
  }

  // If already hashed (e.g. from seed or external hashing), do not re-hash
  if (!BCRYPT_HASH_REGEX.test(this.passwordHash)) {
    const salt = await bcrypt.genSalt(BCRYPT_ROUNDS);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  }
});

// Compare password instance method
userSchema.methods.comparePassword = async function (
  this: UserDocument,
  candidate: string,
): Promise<boolean> {
  if (!this.passwordHash) {
    return false;
  }
  return bcrypt.compare(candidate, this.passwordHash);
};

// Return public-safe user representation with no hash
userSchema.methods.toPublic = function (this: UserDocument): PublicUser {
  const userId = this._id.toString();
  const addressList: UserAddress[] = (this.addresses ?? []).map((addr) => {
    const addrId = addr._id ? addr._id.toString() : '';
    const cleanAddr: UserAddress = {
      id: addrId,
      _id: addrId,
      label: addr.label,
      line1: addr.line1,
      city: addr.city,
      isDefault: Boolean(addr.isDefault),
    };
    if (addr.notes !== undefined && addr.notes !== null && addr.notes !== '') {
      cleanAddr.notes = addr.notes;
    }
    return cleanAddr;
  });

  const publicUser: PublicUser = {
    id: userId,
    _id: userId,
    name: this.name,
    email: this.email,
    role: this.role,
    isActive: this.isActive,
    addresses: addressList,
    createdAt: this.createdAt ? this.createdAt.toISOString() : new Date().toISOString(),
    updatedAt: this.updatedAt ? this.updatedAt.toISOString() : new Date().toISOString(),
  };

  if (this.phone) {
    publicUser.phone = this.phone;
  }

  return publicUser;
};

export const User: UserModel =
  (mongoose.models.User as UserModel) || model<IUser, UserModel>('User', userSchema);

export default User;

