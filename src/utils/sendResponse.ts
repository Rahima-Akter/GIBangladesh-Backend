import { Response } from "express";

interface ResponseData {
  success: boolean;
  message: string;
  data?: any;
  meta?: {
    page: number;
    limit: number;
    total: number;
  };
}

const sendResponse = (
  res: Response,
  statusCode: number,
  message: string,
  data?: any,
  meta?: any
) => {
  const response: ResponseData = {
    success: true,
    message,
  };

  if (data !== undefined) {
    response.data = data;
  }

  if (meta) {
    response.meta = meta;
  }

  res.status(statusCode).json(response);
};

export default sendResponse;