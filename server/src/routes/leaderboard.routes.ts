import { Router } from 'express';
import { getLeaderboard } from '../controllers/leaderboard.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.get('/', requireAuth, getLeaderboard);

export default router;
