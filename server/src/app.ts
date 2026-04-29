import cors from 'cors';
import express, { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import authRoutes from './routes/auth.routes';
import gameRoutes from './routes/game.routes';
import leaderboardRoutes from './routes/leaderboard.routes';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/games', gameRoutes);
app.use('/leaderboard', leaderboardRoutes);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Global error handler
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2003') {
      res.status(401).json({ message: 'User not found. Please log in again.' });
      return;
    }
    if (err.code === 'P2025') {
      res.status(404).json({ message: 'Record not found.' });
      return;
    }
  }
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});

export default app;
