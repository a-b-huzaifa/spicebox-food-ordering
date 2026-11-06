/**
 * Authorization Matrix for /api/menu-items:
 * -------------------------------------------------------------------------------------------------------
 * Route                               Method   Auth Required   Roles Allowed       Success Status / Desc
 * -------------------------------------------------------------------------------------------------------
 * /api/menu-items/:id                 PATCH    Yes             Owner (parent), ad  200 (update item)
 * /api/menu-items/:id                 DELETE   Yes             Owner (parent), ad  200 (delete item)
 * /api/menu-items/:id/availability    PATCH    Yes             Owner (parent), ad  200 (toggle availability)
 * -------------------------------------------------------------------------------------------------------
 */

import { Router, type Response } from 'express';
import mongoose from 'mongoose';
import { type AuthRequest, authorize, protect } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { MenuItem } from '../models/MenuItem';
import { Restaurant } from '../models/Restaurant';
import type { MenuItemDTO } from '../types';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { verifyOwnership } from '../utils/ownership';
import { ok } from '../utils/respond';
import {
  type AvailabilityToggleInput,
  type UpdateMenuItemInput,
  availabilityToggleSchema,
  updateMenuItemSchema,
} from '../validators/menuItem';

const router = Router();

/**
 * PATCH /api/menu-items/:id
 * Only the owner of the parent restaurant or an admin can update a menu item.
 */
router.patch(
  '/:id',
  protect,
  authorize('owner', 'admin'),
  validate(updateMenuItemSchema),
  asyncHandler<AuthRequest>(async (req: AuthRequest, res: Response) => {
    const param = req.params.id;
    const id = Array.isArray(param) ? param[0] : param;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      throw AppError.badRequest('Invalid menu item ID');
    }

    const menuItem = await MenuItem.findById(id);
    if (!menuItem) {
      throw AppError.notFound('Menu item not found');
    }

    const restaurant = await Restaurant.findById(menuItem.restaurant);
    if (!restaurant) {
      throw AppError.notFound('Parent restaurant not found');
    }

    // Verify ownership against the parent restaurant's owner
    verifyOwnership(
      req.user,
      restaurant.owner,
      'You do not have permission to edit menu items for this restaurant',
    );

    const data = req.body as UpdateMenuItemInput;
    if (data.name !== undefined) menuItem.name = data.name;
    if (data.description !== undefined) menuItem.description = data.description;
    if (data.price !== undefined) menuItem.price = data.price;
    if (data.image !== undefined) menuItem.image = data.image;
    if (data.section !== undefined) menuItem.section = data.section;
    if (data.isAvailable !== undefined) menuItem.isAvailable = data.isAvailable;
    if (data.isVeg !== undefined) menuItem.isVeg = data.isVeg;
    if (data.prepTimeMinutes !== undefined) menuItem.prepTimeMinutes = data.prepTimeMinutes;

    await menuItem.save();

    return ok<MenuItemDTO>(res, menuItem.toDTO(), 200, 'Menu item updated successfully');
  }),
);

/**
 * DELETE /api/menu-items/:id
 * Only the owner of the parent restaurant or an admin can delete a menu item.
 */
router.delete(
  '/:id',
  protect,
  authorize('owner', 'admin'),
  asyncHandler<AuthRequest>(async (req: AuthRequest, res: Response) => {
    const param = req.params.id;
    const id = Array.isArray(param) ? param[0] : param;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      throw AppError.badRequest('Invalid menu item ID');
    }

    const menuItem = await MenuItem.findById(id);
    if (!menuItem) {
      throw AppError.notFound('Menu item not found');
    }

    const restaurant = await Restaurant.findById(menuItem.restaurant);
    if (!restaurant) {
      throw AppError.notFound('Parent restaurant not found');
    }

    verifyOwnership(
      req.user,
      restaurant.owner,
      'You do not have permission to delete menu items from this restaurant',
    );

    await menuItem.deleteOne();

    return ok<{ id: string }>(
      res,
      { id: menuItem._id.toString() },
      200,
      'Menu item deleted successfully',
    );
  }),
);

/**
 * PATCH /api/menu-items/:id/availability
 * Toggles or sets availability of a menu item (owner of parent restaurant only).
 */
router.patch(
  '/:id/availability',
  protect,
  authorize('owner', 'admin'),
  validate(availabilityToggleSchema),
  asyncHandler<AuthRequest>(async (req: AuthRequest, res: Response) => {
    const param = req.params.id;
    const id = Array.isArray(param) ? param[0] : param;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      throw AppError.badRequest('Invalid menu item ID');
    }

    const menuItem = await MenuItem.findById(id);
    if (!menuItem) {
      throw AppError.notFound('Menu item not found');
    }

    const restaurant = await Restaurant.findById(menuItem.restaurant);
    if (!restaurant) {
      throw AppError.notFound('Parent restaurant not found');
    }

    verifyOwnership(
      req.user,
      restaurant.owner,
      'You do not have permission to update availability for this restaurant',
    );

    const { isAvailable } = req.body as AvailabilityToggleInput;
    menuItem.isAvailable = isAvailable !== undefined ? isAvailable : !menuItem.isAvailable;
    await menuItem.save();

    return ok<MenuItemDTO>(res, menuItem.toDTO(), 200, 'Menu item availability updated');
  }),
);

export default router;

