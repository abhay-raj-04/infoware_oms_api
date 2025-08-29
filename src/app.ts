import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv'; 
import cors from 'cors';
import authRoutes from './features/auth/auth.routes.js';

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());

app.get('/', (req: Request, res: Response) => {
  res.status(200).json({ message: 'Welcome to the Mini OMS API!' });
});

// Auth routes
app.use('/api/auth', authRoutes);

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    message: err.message || 'An unexpected error occurred.',
    error: process.env.NODE_ENV === 'production' ? null : err.stack
  });
});

export default app;