import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  // Handle mongoose validation errors
  let errors = null;
  if (err.name === 'ValidationError') {
    errors = Object.values(err.errors).map((val: any) => val.message);
  }

  // Handle Zod validation errors (if thrown to global handler)
  if (err.name === 'ZodError') {
    errors = err.errors;
  }

  sendError(res, statusCode, message, errors);
};
