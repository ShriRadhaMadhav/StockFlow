import dotenv from 'dotenv';
// Load environment variables
dotenv.config();

import app from '../server/src/app';
import { connectDB } from '../server/src/config/db';

let isConnected = false;

// Serverless handler for Vercel
export default async function handler(req: any, res: any) {
  try {
    if (!isConnected) {
      await connectDB();
      isConnected = true;
    }
    // Forward the request to the Express application
    return app(req, res);
  } catch (error: any) {
    console.error('Serverless function error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error in backend runtime',
      error: error.message,
    });
  }
}
