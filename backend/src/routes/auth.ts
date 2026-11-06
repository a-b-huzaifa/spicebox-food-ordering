/**
 * Authorization Matrix for /api/auth:
 * ------------------------------------------------------------------------------------------
 * Route                Method   Auth Required   Roles Allowed    Success Status / Description
 * ------------------------------------------------------------------------------------------
 * /api/auth/register   POST     No              Public           201 Created (customer or owner)
 * /api/auth/login      POST     No              Public           200 OK
 * /api/auth/me         GET      Yes (Bearer)    All authenticated 200 OK
 * ------------------------------------------------------------------------------------------
 * Security notes:
 * - Admin registration is strictly blocked from public registration (role "admin" -> 400).
 * - Deactivated accounts receive 403 Forbidden on login and token verification.
 * - Login failures always return generic 401 "Invalid email or password" to prevent enumeration.
 */

import { Router } from 'express';
import { type AuthRequest, protect, signToken } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { User } from '../models/User';
import type { PublicUser } from '../types';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { ok } from '../utils/respond';
import { type LoginInput, type RegisterInput, loginSchema, registerSchema } from '../validators/auth';

export interface AuthSuccessData {
  user: PublicUser;
  token: string;
}

const router = Router();

/**
 * POST /api/auth/register
 * Register a new user (customer or owner only).
 */
router.post(
  '/register',
  validate(registerSchema),
  asyncHandler(async (req, res) => {
    const { name, email, password, role, phone } = req.body as RegisterInput;

    // Strict security check: admin role is never accepted from public requests
    if ((role as string) === 'admin') {
      throw AppError.badRequest('Admin role cannot be registered publicly');
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw AppError.conflict('An account with this email already exists');
    }

    const user = await User.create({
      name,
      email,
      passwordHash: password,
      role: role ?? 'customer',
      phone,
    });

    const token = signToken({
      userId: user._id.toString(),
      role: user.role,
    });

    return ok<AuthSuccessData>(
      res,
      { user: user.toPublic(), token },
      201,
      'Registration successful',
    );
  }),
);

/**
 * POST /api/auth/login
 * Authenticate user with email and password.
 */
router.post(
  '/login',
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body as LoginInput;

    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user) {
      throw AppError.unauthorized('Invalid email or password');
    }

    if (!user.isActive) {
      throw AppError.forbidden('Your account has been deactivated');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw AppError.unauthorized('Invalid email or password');
    }

    const token = signToken({
      userId: user._id.toString(),
      role: user.role,
    });

    return ok<AuthSuccessData>(
      res,
      { user: user.toPublic(), token },
      200,
      'Login successful',
    );
  }),
);

/**
 * GET /api/auth/me
 * Retrieve the current authenticated user's profile.
 */
router.get(
  '/me',
  protect,
  asyncHandler<AuthRequest>(async (req, res) => {
    const token = req.headers.authorization?.slice(7).trim() || '';

    return ok<AuthSuccessData>(
      res,
      { user: req.user.toPublic(), token },
      200,
      'Profile retrieved successfully',
    );
  }),
);

export default router;

