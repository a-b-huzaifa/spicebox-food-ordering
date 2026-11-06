import type { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import { ZodError } from 'zod';
import { env } from '../config/env';
import type { ApiFailure } from '../types';
import { AppError } from '../utils/AppError';

interface MongoDuplicateKeyError extends Error {
  code: 11000;
  keyValue?: Record<string, unknown>;
}

// Errors raised by Express's body parser (malformed JSON, payload too large)
// carry their own 4xx status. Treat those as client errors, not server faults.
interface BodyParserError extends Error {
  status: number;
  type?: string;
}

function isBodyParserError(error: unknown): error is BodyParserError {
  if (!(error instanceof Error)) return false;
  const status = (error as { status?: unknown }).status;
  return typeof status === 'number' && status >= 400 && status < 500;
}

function isDuplicateKeyError(error: unknown): error is MongoDuplicateKeyError {
  return error instanceof Error && (error as { code?: unknown }).code === 11000;
}

// One place that turns any thrown value into a consistent ApiFailure body
// with the right status code.
export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction): void {
  let status = 500;
  let message = 'Something went wrong on our side';
  let code = 'INTERNAL_ERROR';
  let details: unknown;

  if (error instanceof AppError) {
    status = error.statusCode;
    message = error.message;
    code = error.code ?? 'ERROR';
    details = error.details;
  } else if (isBodyParserError(error)) {
    status = error.status;
    code = error.type === 'entity.too.large' ? 'PAYLOAD_TOO_LARGE' : 'INVALID_BODY';
    message = error.type === 'entity.too.large' ? 'Request body is too large' : 'Request body is not valid JSON';
  } else if (error instanceof ZodError) {
    status = 400;
    message = 'Validation failed';
    code = 'VALIDATION_ERROR';
    details = error.issues.map((i) => ({ path: i.path.join('.'), message: i.message }));
  } else if (error instanceof mongoose.Error.ValidationError) {
    status = 400;
    message = Object.values(error.errors).map((e) => e.message).join(', ');
    code = 'VALIDATION_ERROR';
  } else if (error instanceof mongoose.Error.CastError) {
    status = 400;
    message = `Invalid ${error.path}`;
    code = 'INVALID_ID';
  } else if (isDuplicateKeyError(error)) {
    status = 409;
    const field = Object.keys(error.keyValue ?? {})[0] ?? 'value';
    message = `${field} is already in use`;
    code = 'DUPLICATE';
  } else if (env.NODE_ENV !== 'production') {
    console.error(error);
  }

  const body: ApiFailure = {
    success: false,
    error: { message, code, ...(details !== undefined ? { details } : {}) },
  };
  res.status(status).json(body);
}
