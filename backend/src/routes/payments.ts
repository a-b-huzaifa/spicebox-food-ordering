/**
 * Authorization Matrix for /api/payments:
 * ---------------------------------------------------------------------------------------------------------
 * Route                               Method   Auth Required   Roles Allowed       Success Status / Desc
 * ---------------------------------------------------------------------------------------------------------
 * /api/payments/methods               GET      No              Public              200 (list available methods)
 * /api/payments/:orderId/initiate     POST     Yes             customer (own), ad  200 (initiate payment)
 * ---------------------------------------------------------------------------------------------------------
 */

import { Router, type Request, type Response } from 'express';
import mongoose from 'mongoose';
import { type AuthRequest, protect } from '../middleware/auth';
import { Order } from '../models/Order';
import { Payment } from '../models/Payment';
import { getAvailablePaymentMethods, getPaymentProvider } from '../services/payments/registry';
import type { PaymentDTO, PaymentMethodOption } from '../types';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { ok } from '../utils/respond';

export interface InitiatePaymentResponse {
  payment: PaymentDTO;
  initData: unknown;
}

const router = Router();

/**
 * GET /api/payments/methods
 * Public endpoint: returns list of supported payment methods and their current availability.
 */
router.get(
  '/methods',
  asyncHandler(async (_req: Request, res: Response) => {
    const methods: PaymentMethodOption[] = getAvailablePaymentMethods();
    return ok<PaymentMethodOption[]>(res, methods);
  }),
);

/**
 * POST /api/payments/:orderId/initiate
 * Initiates payment with the provider configured for this order.
 */
router.post(
  '/:orderId/initiate',
  protect,
  asyncHandler<AuthRequest>(async (req: AuthRequest, res: Response) => {
    const param = req.params.orderId;
    const orderId = Array.isArray(param) ? param[0] : param;
    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
      throw AppError.badRequest('Invalid order ID');
    }

    const order = await Order.findById(orderId);
    if (!order) {
      throw AppError.notFound('Order not found');
    }

    // Must be the customer who placed the order or an admin
    if (req.user.role === 'customer' && order.customer.toString() !== req.user._id.toString()) {
      throw AppError.forbidden('You do not have permission to pay for this order');
    }

    // Ensure payment record exists for this order
    let payment = await Payment.findOne({ order: order._id });
    if (!payment) {
      payment = await Payment.create({
        order: order._id,
        method: order.paymentMethod,
        amount: order.total,
        status: 'unpaid',
        provider: order.paymentMethod,
      });
    }

    const provider = getPaymentProvider(order.paymentMethod);
    if (!provider.isAvailable()) {
      throw new AppError(
        503,
        `Payment method "${order.paymentMethod}" is currently unavailable`,
        'PAYMENT_METHOD_UNAVAILABLE',
      );
    }

    const initData = await provider.initiate(order);

    return ok<InitiatePaymentResponse>(
      res,
      {
        payment: payment.toDTO(),
        initData,
      },
      200,
      'Payment initiated successfully',
    );
  }),
);

export default router;

