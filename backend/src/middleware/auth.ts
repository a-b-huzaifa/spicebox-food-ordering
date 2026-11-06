import type { NextFunction, Request, RequestHandler, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { User, type UserDocument } from '../models/User';
import type { Role } from '../types';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';

export interface TokenPayload {
  userId: string;
  role: Role;
}

export interface AuthRequest extends Request {
  user: UserDocument;
}

/**
 * Generate a signed JWT for the authenticated user
 */
export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

/**
 * Middleware: Verifies Bearer token, fetches user, and attaches to req.user
 */
export const protect: RequestHandler = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw AppError.unauthorized('No authorization token provided');
    }

    const token = authHeader.slice(7).trim();
    if (!token) {
      throw AppError.unauthorized('Invalid authorization header format');
    }

    let decoded: TokenPayload;
    try {
      decoded = jwt.verify(token, env.JWT_SECRET) as TokenPayload;
    } catch {
      throw AppError.unauthorized('Invalid or expired token');
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      throw AppError.unauthorized('User associated with this token no longer exists');
    }

    if (!user.isActive) {
      throw AppError.forbidden('Your account has been deactivated');
    }

    (req as AuthRequest).user = user;
    next();
  },
);

/**
 * Middleware: Role gating based on attached req.user
 */
export function authorize(...roles: Role[]): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const authReq = req as AuthRequest;
    if (!authReq.user) {
      throw AppError.unauthorized('Authentication required');
    }
    if (!roles.includes(authReq.user.role)) {
      throw AppError.forbidden('You do not have permission to access this resource');
    }
    next();
  };
}

