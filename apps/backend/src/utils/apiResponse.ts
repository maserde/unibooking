import type { Response } from 'express';

export function successResponse<T>(
  res: Response,
  data: T,
  message = 'Success',
  statusCode = 200,
): Response {
  return res.status(statusCode).json({ success: true, message, data });
}

export function errorResponse(
  res: Response,
  message: string,
  statusCode = 400,
  details?: unknown,
): Response {
  return res.status(statusCode).json({ success: false, error: message, details });
}
