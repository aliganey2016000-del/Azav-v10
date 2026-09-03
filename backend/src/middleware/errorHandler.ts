import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('[Error Middleware]:', err);

  // Zod validation error
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input parameters',
        details: err.flatten().fieldErrors,
      },
    });
    return;
  }

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: err.message,
        details: err.errors,
      },
    });
    return;
  }

  // Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_ID',
        message: `Invalid format for field '${err.path}'`,
      },
    });
    return;
  }

  // Duplicate key error (11000)
  if (err.code === 11000 || err.name === 'MongoServerError') {
    const field = Object.keys(err.keyPattern || err.keyValue || {})[0] || 'field';
    res.status(409).json({
      success: false,
      error: {
        code: 'DUPLICATE_ENTRY',
        message: `A record with this ${field} already exists.`,
      },
    });
    return;
  }

  // MongoDB connection and ServerSelection timeouts
  const isMongoConnectionError = 
    err.name === 'MongooseServerSelectionError' ||
    err.name === 'MongooseError' ||
    (err.message && (
      err.message.includes('buffering timed out') ||
      err.message.includes('not connected') ||
      err.message.includes('connection is closed') ||
      err.message.includes('ServerSelectionError') ||
      err.message.includes('TopologyDescription')
    ));

  if (isMongoConnectionError) {
    res.status(503).json({
      success: false,
      error: {
        code: 'DATABASE_CONNECTION_ERROR',
        message: 'Could not connect to the MongoDB Atlas cluster. This usually means your Atlas Database cluster blocks the container\'s IP. Please go to your MongoDB Atlas dashboard, select "Network Access" under Security, and add "0.0.0.0/0" (Allow access from anywhere) to your IP Whitelist, then refresh the application preview.',
        details: err.message,
      },
    });
    return;
  }

  // Custom HTTP status error
  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'An unexpected internal server error occurred';

  res.status(statusCode).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message,
    },
  });
}
