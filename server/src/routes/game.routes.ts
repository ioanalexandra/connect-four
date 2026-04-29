import { Router } from 'express';
import {
  acceptChallenge,
  forfeitGame,
  getActiveGameForUser,
  getGame,
  getHistory,
  getMyGames,
  joinGame,
  makeMove,
} from '../controllers/game.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.use(requireAuth);

router.post('/join', joinGame);
router.post('/challenge/accept', acceptChallenge);
router.get('/active', getActiveGameForUser);
router.get('/history', getMyGames);
router.get('/:id', getGame);
router.post('/:id/move', makeMove);
router.post('/:id/forfeit', forfeitGame);
router.get('/:id/history', getHistory);

export default router;
