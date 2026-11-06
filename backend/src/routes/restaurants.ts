/**
 * Authorization Matrix for /api/restaurants:
 * ---------------------------------------------------------------------------------------------
 * Route                         Method   Auth Required   Roles Allowed    Success Status / Desc
 * ---------------------------------------------------------------------------------------------
 * /api/restaurants              GET      No              Public           200 (approved only)
 * /api/restaurants/:idOrSlug    GET      Optional        Public / Owner   200 (approved, or own/admin)
 * /api/restaurants              POST     Yes             owner, admin     201 (created as pending)
 * /api/restaurants/:id          PATCH    Yes             owner (self), ad 200 (edit own)
 * /api/restaurants/:id          DELETE   Yes             owner (self), ad 200 (delete own)
 * /api/restaurants/:id/status   PATCH    Yes             admin only       200 (approve/reject)
 * ---------------------------------------------------------------------------------------------
 */

import { Router, type Request, type Response } from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { env } from '../config/env';
import { type AuthRequest, authorize, protect } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { Restaurant, type RestaurantDocument, slugify } from '../models/Restaurant';
import { User, type UserDocument } from '../models/User';
import type { Paginated, RestaurantDTO } from '../types';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { verifyOwnership } from '../utils/ownership';
import { paginate } from '../utils/paginate';
import { ok } from '../utils/respond';
import {
  type CreateRestaurantInput,
  type RestaurantQueryInput,
  type RestaurantStatusInput,
  type UpdateRestaurantInput,
  createRestaurantSchema,
  restaurantQuerySchema,
  restaurantStatusSchema,
  updateRestaurantSchema,
} from '../validators/restaurant';

const router = Router();

/**
 * Helper to optionally extract authenticated user from Bearer token
 */
async function getOptionalUser(req: Request): Promise<UserDocument | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.slice(7).trim();
  if (!token) {
    return null;
  }
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as { userId: string };
    const user = await User.findById(decoded.userId);
    return user && user.isActive ? user : null;
  } catch {
    return null;
  }
}

/**
 * GET /api/restaurants
 * Public endpoint: lists approved restaurants with search, category filter, sorting, and pagination.
 */
router.get(
  '/',
  validate({ query: restaurantQuerySchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const queryInput = req.query as unknown as RestaurantQueryInput;
    const { search, category, sort, page = 1, limit = 10 } = queryInput;

    const filter: Record<string, unknown> = { status: 'approved' };

    if (search) {
      const escaped = search.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
      const searchRegex = new RegExp(escaped, 'i');
      filter.$or = [
        { name: searchRegex },
        { description: searchRegex },
        { cuisine: searchRegex },
      ];
    }

    if (category) {
      filter.categories = category;
    }

    const sortOptions: Record<string, 1 | -1> = {};
    switch (sort) {
      case 'rating':
        sortOptions.ratingAverage = -1;
        sortOptions.ratingCount = -1;
        break;
      case 'deliveryFee':
        sortOptions.deliveryFee = 1;
        break;
      case 'eta':
        sortOptions['etaMinutes.min'] = 1;
        break;
      case 'name':
        sortOptions.name = 1;
        break;
      case 'newest':
        sortOptions.createdAt = -1;
        break;
      default:
        sortOptions.ratingAverage = -1;
        sortOptions._id = -1;
        break;
    }

    const dataQuery = Restaurant.find(filter).sort(sortOptions);
    const countQuery = Restaurant.countDocuments(filter);

    const result: Paginated<RestaurantDTO> = await paginate<RestaurantDTO, RestaurantDocument>(
      dataQuery,
      countQuery,
      { page, limit },
      (doc) => doc.toDTO(),
    );

    return ok<Paginated<RestaurantDTO>>(res, result);
  }),
);

/**
 * GET /api/restaurants/:idOrSlug
 * Public endpoint: approved only unless caller is that restaurant's owner or an admin.
 */
router.get(
  '/:idOrSlug',
  asyncHandler(async (req: Request, res: Response) => {
    const param = req.params.idOrSlug;
    const idOrSlug = Array.isArray(param) ? param[0] : param;
    if (!idOrSlug) {
      throw AppError.badRequest('Restaurant identifier is required');
    }

    const isObjectId = mongoose.Types.ObjectId.isValid(idOrSlug);

    const restaurant = await Restaurant.findOne(
      isObjectId ? { $or: [{ _id: idOrSlug }, { slug: idOrSlug }] } : { slug: idOrSlug },
    );

    if (!restaurant) {
      throw AppError.notFound('Restaurant not found');
    }

    // Approved restaurants can be viewed by anyone
    if (restaurant.status === 'approved') {
      return ok<RestaurantDTO>(res, restaurant.toDTO());
    }

    // Non-approved restaurants can only be viewed by the owner or an admin
    const caller = await getOptionalUser(req);
    if (
      caller &&
      (caller.role === 'admin' || caller._id.toString() === restaurant.owner.toString())
    ) {
      return ok<RestaurantDTO>(res, restaurant.toDTO());
    }

    throw AppError.notFound('Restaurant not found');
  }),
);

/**
 * POST /api/restaurants
 * Owner/Admin creates a new restaurant (always created with status "pending").
 */
router.post(
  '/',
  protect,
  authorize('owner', 'admin'),
  validate(createRestaurantSchema),
  asyncHandler<AuthRequest>(async (req: AuthRequest, res: Response) => {
    const data = req.body as CreateRestaurantInput;

    let targetSlug = data.slug ? slugify(data.slug) : slugify(data.name);
    const existingSlug = await Restaurant.findOne({ slug: targetSlug });
    if (existingSlug) {
      if (data.slug) {
        throw AppError.conflict('A restaurant with this slug already exists');
      }
      // Auto-append random suffix if auto-generated slug collides
      targetSlug = `${targetSlug}-${Date.now().toString(36)}`;
    }

    const restaurant = await Restaurant.create({
      ...data,
      owner: req.user._id,
      slug: targetSlug,
      status: 'pending', // Strict rule: restaurants are always created as pending
      ratingAverage: 0,
      ratingCount: 0,
    });

    return ok<RestaurantDTO>(
      res,
      restaurant.toDTO(),
      201,
      'Restaurant created and submitted for approval',
    );
  }),
);

/**
 * PATCH /api/restaurants/:id
 * Only the owner of that restaurant or an admin can update it.
 */
router.patch(
  '/:id',
  protect,
  authorize('owner', 'admin'),
  validate(updateRestaurantSchema),
  asyncHandler<AuthRequest>(async (req: AuthRequest, res: Response) => {
    const param = req.params.id;
    const id = Array.isArray(param) ? param[0] : param;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      throw AppError.badRequest('Invalid restaurant ID');
    }

    const restaurant = await Restaurant.findById(id);
    if (!restaurant) {
      throw AppError.notFound('Restaurant not found');
    }

    // Must be that restaurant's owner or admin
    verifyOwnership(req.user, restaurant.owner, 'You do not have permission to edit this restaurant');

    const updateData = req.body as UpdateRestaurantInput;

    if (updateData.slug && updateData.slug !== restaurant.slug) {
      const cleanSlug = slugify(updateData.slug);
      const conflict = await Restaurant.findOne({ slug: cleanSlug, _id: { $ne: restaurant._id } });
      if (conflict) {
        throw AppError.conflict('A restaurant with this slug already exists');
      }
      restaurant.slug = cleanSlug;
    }

    if (updateData.name !== undefined) restaurant.name = updateData.name;
    if (updateData.description !== undefined) restaurant.description = updateData.description;
    if (updateData.cuisine !== undefined) restaurant.cuisine = updateData.cuisine;
    if (updateData.categories !== undefined) restaurant.categories = updateData.categories;
    if (updateData.image !== undefined) restaurant.image = updateData.image;
    if (updateData.address !== undefined) restaurant.address = updateData.address;
    if (updateData.phone !== undefined) restaurant.phone = updateData.phone;
    if (updateData.deliveryFee !== undefined) restaurant.deliveryFee = updateData.deliveryFee;
    if (updateData.minOrder !== undefined) restaurant.minOrder = updateData.minOrder;
    if (updateData.etaMinutes !== undefined) restaurant.etaMinutes = updateData.etaMinutes;
    if (updateData.isOpen !== undefined) restaurant.isOpen = updateData.isOpen;

    // Note: status cannot be modified here; admin status endpoint must be used
    await restaurant.save();

    return ok<RestaurantDTO>(res, restaurant.toDTO(), 200, 'Restaurant updated successfully');
  }),
);

/**
 * DELETE /api/restaurants/:id
 * Only the owner of that restaurant or an admin can delete it.
 */
router.delete(
  '/:id',
  protect,
  authorize('owner', 'admin'),
  asyncHandler<AuthRequest>(async (req: AuthRequest, res: Response) => {
    const param = req.params.id;
    const id = Array.isArray(param) ? param[0] : param;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      throw AppError.badRequest('Invalid restaurant ID');
    }

    const restaurant = await Restaurant.findById(id);
    if (!restaurant) {
      throw AppError.notFound('Restaurant not found');
    }

    verifyOwnership(req.user, restaurant.owner, 'You do not have permission to delete this restaurant');

    await restaurant.deleteOne();

    return ok<{ id: string }>(
      res,
      { id: restaurant._id.toString() },
      200,
      'Restaurant deleted successfully',
    );
  }),
);

/**
 * PATCH /api/restaurants/:id/status
 * Admin only: approve or reject a restaurant.
 */
router.patch(
  '/:id/status',
  protect,
  authorize('admin'),
  validate(restaurantStatusSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const param = req.params.id;
    const id = Array.isArray(param) ? param[0] : param;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      throw AppError.badRequest('Invalid restaurant ID');
    }

    const { status } = req.body as RestaurantStatusInput;

    const restaurant = await Restaurant.findById(id);
    if (!restaurant) {
      throw AppError.notFound('Restaurant not found');
    }

    restaurant.status = status;
    await restaurant.save();

    return ok<RestaurantDTO>(
      res,
      restaurant.toDTO(),
      200,
      `Restaurant status updated to ${status}`,
    );
  }),
);

export default router;

