/**
 * Authorization Matrix for /api/orders:
 * ---------------------------------------------------------------------------------------------------------
 * Route                   Method   Auth Required   Roles Allowed       Success Status / Desc
 * ---------------------------------------------------------------------------------------------------------
 * /api/orders             POST     Yes             customer, admin     201 (recompute price, create order)
 * /api/orders             GET      Yes             customer, owner, ad 200 (customer: own, owner: rest, ad: all)
 * /api/orders/:id         GET      Yes             customer (own),     200 (view single order)
 *                                                  owner (rest), admin
 * /api/orders/:id/status  PATCH    Yes             customer (cancel),  200 (state machine transition)
 *                                                  owner, admin
 * ---------------------------------------------------------------------------------------------------------
 */

import { Router, type Response } from 'express';
import mongoose from 'mongoose';
import { type AuthRequest, authorize, protect } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { MenuItem } from '../models/MenuItem';
import { Order, type IOrderItem, type OrderDocument } from '../models/Order';
import { Restaurant } from '../models/Restaurant';
import type { OrderDTO, OrderStatus, Paginated } from '../types';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { canTransition } from '../utils/orderState';
import { paginate } from '../utils/paginate';
import { ok } from '../utils/respond';
import {
  type CreateOrderInput,
  type OrderQueryInput,
  type OrderStatusUpdateInput,
  createOrderSchema,
  orderQuerySchema,
  orderStatusUpdateSchema,
} from '../validators/order';

const router = Router();

router.use(protect);

/**
 * POST /api/orders
 * Customer places an order. Prices and totals are ALWAYS recomputed from DB.
 */
router.post(
  '/',
  authorize('customer', 'admin'),
  validate(createOrderSchema),
  asyncHandler<AuthRequest>(async (req: AuthRequest, res: Response) => {
    const data = req.body as CreateOrderInput;

    if (!mongoose.Types.ObjectId.isValid(data.restaurant)) {
      throw AppError.badRequest('Invalid restaurant ID');
    }

    // 1. Fetch and validate restaurant
    const restaurant = await Restaurant.findById(data.restaurant);
    if (!restaurant) {
      throw AppError.notFound('Restaurant not found');
    }

    if (restaurant.status !== 'approved') {
      throw AppError.badRequest('Restaurant is not currently approved for food ordering');
    }

    if (!restaurant.isOpen) {
      throw AppError.badRequest('Restaurant is currently closed');
    }

    // 2. Fetch and validate menu items from the database
    const requestedItemsMap = new Map<string, number>();
    for (const item of data.items) {
      if (!mongoose.Types.ObjectId.isValid(item.menuItem)) {
        throw AppError.badRequest(`Invalid menu item ID: ${item.menuItem}`);
      }
      const existingQty = requestedItemsMap.get(item.menuItem) ?? 0;
      requestedItemsMap.set(item.menuItem, existingQty + item.quantity);
    }

    const itemIds = Array.from(requestedItemsMap.keys());
    const dbMenuItems = await MenuItem.find({ _id: { $in: itemIds } });

    if (dbMenuItems.length !== itemIds.length) {
      throw AppError.badRequest('One or more selected menu items do not exist');
    }

    // 3. Recompute prices, check restaurant affiliation and availability
    let subtotal = 0;
    const orderItems: IOrderItem[] = [];

    for (const dbItem of dbMenuItems) {
      const dbItemId = dbItem._id.toString();
      const quantity = requestedItemsMap.get(dbItemId) ?? 0;

      // Reject if items span multiple restaurants
      if (dbItem.restaurant.toString() !== restaurant._id.toString()) {
        throw AppError.badRequest('All items in an order must belong to the specified restaurant');
      }

      // Reject if an item is marked unavailable
      if (!dbItem.isAvailable) {
        throw AppError.badRequest(`"${dbItem.name}" is currently unavailable`);
      }

      const itemTotal = dbItem.price * quantity;
      subtotal += itemTotal;

      orderItems.push({
        menuItem: dbItem._id,
        name: dbItem.name,
        price: dbItem.price,
        quantity,
      });
    }

    // Reject if minimum order is not met
    if (subtotal < restaurant.minOrder) {
      throw AppError.badRequest(
        `Order subtotal (Rs. ${subtotal}) is below the restaurant's minimum order requirement of Rs. ${restaurant.minOrder}`,
      );
    }

    const deliveryFee = restaurant.deliveryFee;
    const total = subtotal + deliveryFee;

    // 4. Create order with initial pending status and initial status history
    const order = await Order.create({
      customer: req.user._id,
      restaurant: restaurant._id,
      items: orderItems,
      subtotal,
      deliveryFee,
      total,
      deliveryAddress: {
        label: data.deliveryAddress.label,
        line1: data.deliveryAddress.line1,
        city: data.deliveryAddress.city,
        ...(data.deliveryAddress.notes ? { notes: data.deliveryAddress.notes } : {}),
      },
      notes: data.notes,
      status: 'pending',
      paymentMethod: data.paymentMethod,
      paymentStatus: 'unpaid',
      statusHistory: [
        {
          status: 'pending',
          at: new Date(),
          by: req.user._id,
        },
      ],
    });

    return ok<OrderDTO>(res, order.toDTO(), 201, 'Order placed successfully');
  }),
);

/**
 * GET /api/orders
 * Returns orders scoped by caller role (customer: own; owner: their restaurants; admin: all).
 */
router.get(
  '/',
  validate({ query: orderQuerySchema }),
  asyncHandler<AuthRequest>(async (req: AuthRequest, res: Response) => {
    const queryInput = req.query as unknown as OrderQueryInput;
    const { status, page = 1, limit = 10 } = queryInput;

    const filter: Record<string, unknown> = {};

    if (status) {
      filter.status = status;
    }

    if (req.user.role === 'customer') {
      filter.customer = req.user._id;
    } else if (req.user.role === 'owner') {
      const ownedRestaurants = await Restaurant.find({ owner: req.user._id }).select('_id');
      const restaurantIds = ownedRestaurants.map((r) => r._id);
      filter.restaurant = { $in: restaurantIds };
    }
    // admin role has no additional filter and can view all orders

    const dataQuery = Order.find(filter).sort({ createdAt: -1 });
    const countQuery = Order.countDocuments(filter);

    const result: Paginated<OrderDTO> = await paginate<OrderDTO, OrderDocument>(
      dataQuery,
      countQuery,
      { page, limit },
      (doc) => doc.toDTO(),
    );

    return ok<Paginated<OrderDTO>>(res, result);
  }),
);

/**
 * GET /api/orders/:id
 * Retrieves order details. Allowed for the owning customer, the restaurant owner, or an admin.
 */
router.get(
  '/:id',
  asyncHandler<AuthRequest>(async (req: AuthRequest, res: Response) => {
    const param = req.params.id;
    const id = Array.isArray(param) ? param[0] : param;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      throw AppError.badRequest('Invalid order ID');
    }

    const order = await Order.findById(id);
    if (!order) {
      throw AppError.notFound('Order not found');
    }

    // Role-based visibility check
    if (req.user.role === 'customer') {
      if (order.customer.toString() !== req.user._id.toString()) {
        throw AppError.forbidden('You do not have permission to view this order');
      }
    } else if (req.user.role === 'owner') {
      const restaurant = await Restaurant.findById(order.restaurant);
      if (!restaurant || restaurant.owner.toString() !== req.user._id.toString()) {
        throw AppError.forbidden('You do not have permission to view this order');
      }
    }
    // Admin is permitted to view any order

    return ok<OrderDTO>(res, order.toDTO());
  }),
);

/**
 * PATCH /api/orders/:id/status
 * Transitions order status according to the pure state machine canTransition().
 */
router.patch(
  '/:id/status',
  validate(orderStatusUpdateSchema),
  asyncHandler<AuthRequest>(async (req: AuthRequest, res: Response) => {
    const param = req.params.id;
    const id = Array.isArray(param) ? param[0] : param;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      throw AppError.badRequest('Invalid order ID');
    }

    const { status: targetStatus } = req.body as OrderStatusUpdateInput;

    const order = await Order.findById(id);
    if (!order) {
      throw AppError.notFound('Order not found');
    }

    // Verify caller has permission to act on this order
    if (req.user.role === 'customer') {
      if (order.customer.toString() !== req.user._id.toString()) {
        throw AppError.forbidden('You do not have permission to update this order');
      }
    } else if (req.user.role === 'owner') {
      const restaurant = await Restaurant.findById(order.restaurant);
      if (!restaurant || restaurant.owner.toString() !== req.user._id.toString()) {
        throw AppError.forbidden('You do not have permission to update orders for this restaurant');
      }
    }

    // Check state transition rules via the pure state machine
    const allowed = canTransition(order.status as OrderStatus, targetStatus, req.user.role);
    if (!allowed) {
      throw AppError.badRequest(
        `Cannot transition order status from "${order.status}" to "${targetStatus}" as ${req.user.role}`,
      );
    }

    // Apply status change and record in history
    order.status = targetStatus;
    order.statusHistory.push({
      status: targetStatus,
      at: new Date(),
      by: req.user._id,
    });

    await order.save();

    return ok<OrderDTO>(res, order.toDTO(), 200, `Order status updated to ${targetStatus}`);
  }),
);

export default router;

