import type { Types } from 'mongoose';
import type { Role } from '../types';
import { AppError } from './AppError';

export interface OwnershipUser {
  _id: Types.ObjectId | string;
  role: Role;
}

/**
 * Checks whether a user is an admin or the owner of a given resource.
 * Returns true if allowed, false otherwise.
 */
export function isOwnerOrAdmin(
  user: OwnershipUser,
  resourceOwnerId: Types.ObjectId | string,
): boolean {
  if (user.role === 'admin') {
    return true;
  }
  return user._id.toString() === resourceOwnerId.toString();
}

/**
 * Verifies that the user is the owner of the resource or an admin.
 * Throws AppError.forbidden (403) if unauthorized.
 */
export function verifyOwnership(
  user: OwnershipUser,
  resourceOwnerId: Types.ObjectId | string,
  message = 'You do not have permission to manage this restaurant',
): void {
  if (!isOwnerOrAdmin(user, resourceOwnerId)) {
    throw AppError.forbidden(message);
  }
}

