/**
 * Authorization Matrix for /api/users:
 * --------------------------------------------------------------------------------------------------
 * Route                               Method   Auth Required   Roles Allowed    Success Status / Desc
 * --------------------------------------------------------------------------------------------------
 * /api/users/me                       PATCH    Yes             All auth users   200 (update profile)
 * /api/users/me/addresses             POST     Yes             All auth users   201 (add address)
 * /api/users/me/addresses/:addressId  PATCH    Yes             All auth users   200 (edit address)
 * /api/users/me/addresses/:addressId  DELETE   Yes             All auth users   200 (delete address)
 * /api/users/me/password              PATCH    Yes             All auth users   200 (change password)
 * --------------------------------------------------------------------------------------------------
 */

import { Router, type Response } from 'express';
import mongoose from 'mongoose';
import { type AuthRequest, protect } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { User, type IUserAddress } from '../models/User';
import type { PublicUser } from '../types';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { ok } from '../utils/respond';
import {
  type ChangePasswordInput,
  type CreateAddressInput,
  type UpdateAddressInput,
  type UpdateProfileInput,
  changePasswordSchema,
  createAddressSchema,
  updateAddressSchema,
  updateProfileSchema,
} from '../validators/user';

const router = Router();

// All user profile endpoints require authentication
router.use(protect);

/**
 * PATCH /api/users/me
 * Update name and/or phone number of the authenticated user.
 */
router.patch(
  '/me',
  validate(updateProfileSchema),
  asyncHandler<AuthRequest>(async (req: AuthRequest, res: Response) => {
    const { name, phone } = req.body as UpdateProfileInput;
    const user = req.user;

    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;

    await user.save();

    return ok<PublicUser>(res, user.toPublic(), 200, 'Profile updated successfully');
  }),
);

/**
 * POST /api/users/me/addresses
 * Add a new saved address. Enforces exactly one default address at a time.
 */
router.post(
  '/me/addresses',
  validate(createAddressSchema),
  asyncHandler<AuthRequest>(async (req: AuthRequest, res: Response) => {
    const data = req.body as CreateAddressInput;
    const user = req.user;

    // If marked default or this is the first address, it becomes default and un-defaults others
    const shouldBeDefault = Boolean(data.isDefault) || user.addresses.length === 0;

    if (shouldBeDefault) {
      for (const existing of user.addresses) {
        existing.isDefault = false;
      }
    }

    const newAddress: IUserAddress = {
      _id: new mongoose.Types.ObjectId(),
      label: data.label,
      line1: data.line1,
      city: data.city,
      isDefault: shouldBeDefault,
    };

    if (data.notes !== undefined && data.notes.trim() !== '') {
      newAddress.notes = data.notes.trim();
    }

    user.addresses.push(newAddress);
    await user.save();

    return ok<PublicUser>(res, user.toPublic(), 201, 'Address added successfully');
  }),
);

/**
 * PATCH /api/users/me/addresses/:addressId
 * Update an existing address. Setting isDefault un-defaults all other addresses.
 */
router.patch(
  '/me/addresses/:addressId',
  validate(updateAddressSchema),
  asyncHandler<AuthRequest>(async (req: AuthRequest, res: Response) => {
    const param = req.params.addressId;
    const addressId = Array.isArray(param) ? param[0] : param;
    if (!addressId || !mongoose.Types.ObjectId.isValid(addressId)) {
      throw AppError.badRequest('Invalid address ID');
    }

    const user = req.user;
    const address = user.addresses.id(addressId);
    if (!address) {
      throw AppError.notFound('Address not found');
    }

    const data = req.body as UpdateAddressInput;

    if (data.isDefault === true) {
      // Make this address the single default
      for (const addr of user.addresses) {
        addr.isDefault = addr._id.toString() === address._id.toString();
      }
    } else if (data.isDefault === false && address.isDefault) {
      // Un-defaulting current default: if other addresses exist, make the first other address default
      address.isDefault = false;
      const other = user.addresses.find((a) => a._id.toString() !== address._id.toString());
      if (other) {
        other.isDefault = true;
      } else {
        // If it's the only address, preserve the single default invariant
        address.isDefault = true;
      }
    }

    if (data.label !== undefined) address.label = data.label;
    if (data.line1 !== undefined) address.line1 = data.line1;
    if (data.city !== undefined) address.city = data.city;
    if (data.notes !== undefined) address.notes = data.notes;

    await user.save();

    return ok<PublicUser>(res, user.toPublic(), 200, 'Address updated successfully');
  }),
);

/**
 * DELETE /api/users/me/addresses/:addressId
 * Delete a saved address. If the deleted address was default, reassigns default to another address.
 */
router.delete(
  '/me/addresses/:addressId',
  asyncHandler<AuthRequest>(async (req: AuthRequest, res: Response) => {
    const param = req.params.addressId;
    const addressId = Array.isArray(param) ? param[0] : param;
    if (!addressId || !mongoose.Types.ObjectId.isValid(addressId)) {
      throw AppError.badRequest('Invalid address ID');
    }

    const user = req.user;
    const address = user.addresses.id(addressId);
    if (!address) {
      throw AppError.notFound('Address not found');
    }

    const wasDefault = address.isDefault;
    user.addresses.pull({ _id: addressId });

    // If the default address was removed and other addresses remain, designate the first one as default
    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();

    return ok<PublicUser>(res, user.toPublic(), 200, 'Address deleted successfully');
  }),
);

/**
 * PATCH /api/users/me/password
 * Change password. Requires valid current password; hashes new password via pre-save hook.
 */
router.patch(
  '/me/password',
  validate(changePasswordSchema),
  asyncHandler<AuthRequest>(async (req: AuthRequest, res: Response) => {
    const { currentPassword, newPassword } = req.body as ChangePasswordInput;

    const userWithHash = await User.findById(req.user._id).select('+passwordHash');
    if (!userWithHash) {
      throw AppError.unauthorized('User not found');
    }

    const isMatch = await userWithHash.comparePassword(currentPassword);
    if (!isMatch) {
      throw AppError.badRequest('Current password is incorrect');
    }

    userWithHash.passwordHash = newPassword;
    await userWithHash.save();

    return ok<PublicUser>(res, userWithHash.toPublic(), 200, 'Password updated successfully');
  }),
);

export default router;

