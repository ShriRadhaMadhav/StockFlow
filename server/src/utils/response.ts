import { Response } from 'express';

interface SuccessResponse<T> {
  success: true;
  message: string;
  data: T;
}

interface ErrorResponse {
  success: false;
  message: string;
  errors?: any;
}

export const sendSuccess = <T>(res: Response, statusCode: number, message: string, data: T) => {
  const response: SuccessResponse<T> = {
    success: true,
    message,
    data,
  };
  return res.status(statusCode).json(response);
};

export const sendError = (res: Response, statusCode: number, message: string, errors?: any) => {
  const response: ErrorResponse = {
    success: false,
    message,
    errors,
  };
  return res.status(statusCode).json(response);
};
