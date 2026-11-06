import type { Response } from 'express';
import type { ApiSuccess } from '../types';

// Tiny helper so every success response has the same shape.
export function ok<T>(res: Response, data: T, status = 200, message?: string): Response<ApiSuccess<T>> {
  const body: ApiSuccess<T> = { success: true, data, ...(message ? { message } : {}) };
  return res.status(status).json(body);
}
