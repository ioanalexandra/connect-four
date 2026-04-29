import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { emitToGame, emitToUser } from '../socket';
import {
  Board,
  checkDraw,
  checkWin,
  dropPiece,
  emptyBoard,
  timeRemainingMs,
} from '../utils/connectFour';
import prisma from '../utils/prisma';

async function getActiveGame(userId: string) {
  return prisma.game.findFirst({
    where: {
      status: { in: ['WAITING', 'IN_PROGRESS'] },
      OR: [{ player1Id: userId }, { player2Id: userId }],
    },
  });
}

export async function createGame(req: AuthRequest, res: Response) {
  const userId = req.userId!;

  const active = await getActiveGame(userId);
  if (active) {
    res.status(409).json({ message: 'You are already in a game', gameId: active.id });
    return;
  }

  const game = await prisma.game.create({
    data: {
      player1Id: userId,
      board: emptyBoard(),
      status: 'WAITING',
    },
    include: { player1: { select: { id: true, username: true } } },
  });

  res.status(201).json(game);
}

export async function joinGame(req: AuthRequest, res: Response) {
  const userId = req.userId!;

  const active = await getActiveGame(userId);
  if (active) {
    res.status(409).json({ message: 'You are already in a game', gameId: active.id });
    return;
  }

  const waiting = await prisma.game.findFirst({
    where: { status: 'WAITING', NOT: { player1Id: userId } },
    orderBy: { createdAt: 'asc' },
  });

  if (!waiting) {
    res.status(404).json({ message: 'No games available to join' });
    return;
  }

  const now = new Date();
  const game = await prisma.game.update({
    where: { id: waiting.id },
    data: {
      player2Id: userId,
      status: 'IN_PROGRESS',
      currentTurnId: waiting.player1Id,
      turnStartedAt: now,
    },
    include: {
      player1: { select: { id: true, username: true } },
      player2: { select: { id: true, username: true } },
    },
  });

  res.json(game);
}

export async function getGame(req: AuthRequest, res: Response) {
  const { id } = req.params as { id: string };
  const userId = req.userId!;

  const game = await prisma.game.findUnique({
    where: { id },
    include: {
      player1: { select: { id: true, username: true } },
      player2: { select: { id: true, username: true } },
      winner: { select: { id: true, username: true } },
    },
  });

  if (!game) {
    res.status(404).json({ message: 'Game not found' });
    return;
  }

  // Auto-expire turn if timer ran out
  if (game.status === 'IN_PROGRESS' && game.turnStartedAt && game.currentTurnId) {
    if (timeRemainingMs(game.turnStartedAt) <= 0) {
      const winnerId = game.currentTurnId === game.player1Id ? game.player2Id! : game.player1Id;
      const updated = await expireAndFinish(game.id, game.currentTurnId, winnerId);
      res.json({ ...updated, timeRemaining: 0 });
      return;
    }
  }

  const timeRemaining =
    game.turnStartedAt && game.status === 'IN_PROGRESS'
      ? Math.max(0, timeRemainingMs(game.turnStartedAt))
      : null;

  // Only return board for participants; completed/draw games are public
  const isParticipant = game.player1Id === userId || game.player2Id === userId;
  if (!isParticipant && game.status === 'IN_PROGRESS') {
    res.status(403).json({ message: 'Forbidden' });
    return;
  }

  res.json({ ...game, timeRemaining });
}

export async function makeMove(req: AuthRequest, res: Response) {
  const { id } = req.params as { id: string };
  const userId = req.userId!;
  const column = Number(req.body.column);

  if (isNaN(column) || column < 0 || column > 6) {
    res.status(400).json({ message: 'Column must be between 0 and 6' });
    return;
  }

  const game = await prisma.game.findUnique({ where: { id } });
  if (!game) {
    res.status(404).json({ message: 'Game not found' });
    return;
  }
  if (game.status !== 'IN_PROGRESS') {
    res.status(400).json({ message: 'Game is not in progress' });
    return;
  }
  if (game.currentTurnId !== userId) {
    res.status(403).json({ message: 'It is not your turn' });
    return;
  }

  // Check timer
  if (game.turnStartedAt && timeRemainingMs(game.turnStartedAt) <= 0) {
    const winnerId = userId === game.player1Id ? game.player2Id! : game.player1Id;
    const updated = await expireAndFinish(game.id, userId, winnerId);
    res.status(400).json({ message: 'Time expired', game: updated });
    return;
  }

  const board = game.board as Board;
  const playerNumber = userId === game.player1Id ? 1 : 2;
  const result = dropPiece(board, column, playerNumber as 1 | 2);

  if (!result) {
    res.status(400).json({ message: 'Column is full' });
    return;
  }

  const moveCount = await prisma.move.count({ where: { gameId: id } });
  const now = new Date();

  const isWin = checkWin(result.board, playerNumber);
  const isDraw = !isWin && checkDraw(result.board);

  const nextTurnId = userId === game.player1Id ? game.player2Id! : game.player1Id;

  const [, , , updatedGame] = await prisma.$transaction([
    prisma.move.create({
      data: {
        gameId: id,
        playerId: userId,
        column,
        row: result.row,
        moveNumber: moveCount + 1,
      },
    }),
    ...(isWin || isDraw
      ? [
          prisma.user.update({
            where: { id: userId },
            data: isWin ? { wins: { increment: 1 } } : { draws: { increment: 1 } },
          }),
          prisma.user.update({
            where: { id: nextTurnId },
            data: isWin ? { losses: { increment: 1 } } : { draws: { increment: 1 } },
          }),
        ]
      : [
          prisma.user.findUnique({ where: { id: userId } }),
          prisma.user.findUnique({ where: { id: nextTurnId } }),
        ]),
    prisma.game.update({
      where: { id },
      data: {
        board: result.board,
        status: isWin ? 'COMPLETED' : isDraw ? 'DRAW' : 'IN_PROGRESS',
        winnerId: isWin ? userId : undefined,
        currentTurnId: isWin || isDraw ? null : nextTurnId,
        turnStartedAt: isWin || isDraw ? null : now,
      },
      include: {
        player1: { select: { id: true, username: true } },
        player2: { select: { id: true, username: true } },
        winner: { select: { id: true, username: true } },
      },
    }),
  ]);

  const timeRemaining = !isWin && !isDraw ? Math.max(0, timeRemainingMs(now)) : null;

  emitToGame(id, 'game:updated', { ...updatedGame, timeRemaining });
  res.json({ ...updatedGame, timeRemaining });
}

export async function getHistory(req: Request, res: Response) {
  const { id } = req.params as { id: string };

  const [game, moves] = await Promise.all([
    prisma.game.findUnique({
      where: { id },
      include: {
        player1: { select: { id: true, username: true } },
        player2: { select: { id: true, username: true } },
        winner: { select: { id: true, username: true } },
      },
    }),
    prisma.move.findMany({
      where: { gameId: id },
      orderBy: { moveNumber: 'asc' },
      include: { player: { select: { id: true, username: true } } },
    }),
  ]);

  if (!game) {
    res.status(404).json({ message: 'Game not found' });
    return;
  }

  res.json({ game, moves });
}

export async function getActiveGameForUser(req: AuthRequest, res: Response) {
  const game = await getActiveGame(req.userId!);
  if (!game) {
    res.status(404).json({ message: 'No active game' });
    return;
  }

  const full = await prisma.game.findUnique({
    where: { id: game.id },
    include: {
      player1: { select: { id: true, username: true } },
      player2: { select: { id: true, username: true } },
    },
  });

  const timeRemaining =
    full?.turnStartedAt && full.status === 'IN_PROGRESS'
      ? Math.max(0, timeRemainingMs(full.turnStartedAt))
      : null;

  res.json({ ...full, timeRemaining });
}

export async function forfeitGame(req: AuthRequest, res: Response) {
  const { id } = req.params as { id: string };
  const userId = req.userId!;

  const game = await prisma.game.findUnique({ where: { id } });
  if (!game) {
    res.status(404).json({ message: 'Game not found' });
    return;
  }
  if (game.player1Id !== userId && game.player2Id !== userId) {
    res.status(403).json({ message: 'Forbidden' });
    return;
  }
  if (game.status !== 'IN_PROGRESS' && game.status !== 'WAITING') {
    res.status(400).json({ message: 'Game is already finished' });
    return;
  }

  const winnerId =
    game.status === 'WAITING' ? null : userId === game.player1Id ? game.player2Id! : game.player1Id;

  await prisma.$transaction([
    prisma.game.update({
      where: { id },
      data: { status: 'ABANDONED', winnerId, currentTurnId: null, turnStartedAt: null },
    }),
    ...(winnerId
      ? [
          prisma.user.update({ where: { id: userId }, data: { losses: { increment: 1 } } }),
          prisma.user.update({ where: { id: winnerId }, data: { wins: { increment: 1 } } }),
        ]
      : []),
  ]);

  res.json({ message: 'Game forfeited' });
}

export async function acceptChallenge(req: AuthRequest, res: Response) {
  const { challengerId } = req.body as { challengerId?: string };
  const userId = req.userId!;

  if (!challengerId) {
    res.status(400).json({ message: 'challengerId required' });
    return;
  }

  const [challengerActive, acceptorActive] = await Promise.all([
    getActiveGame(challengerId),
    getActiveGame(userId),
  ]);

  if (challengerActive || acceptorActive) {
    res.status(409).json({ message: 'One of the players is already in a game' });
    return;
  }

  const game = await prisma.game.create({
    data: {
      player1Id: challengerId,
      player2Id: userId,
      board: emptyBoard(),
      status: 'IN_PROGRESS',
      currentTurnId: challengerId,
      turnStartedAt: new Date(),
    },
    include: {
      player1: { select: { id: true, username: true } },
      player2: { select: { id: true, username: true } },
    },
  });

  emitToUser(challengerId, 'challenge:accepted', { gameId: game.id });
  res.status(201).json(game);
}

export async function getMyGames(req: AuthRequest, res: Response) {
  const userId = req.userId!;
  const games = await prisma.game.findMany({
    where: {
      OR: [{ player1Id: userId }, { player2Id: userId }],
      status: { in: ['COMPLETED', 'DRAW', 'ABANDONED'] },
    },
    include: {
      player1: { select: { id: true, username: true } },
      player2: { select: { id: true, username: true } },
      winner: { select: { id: true, username: true } },
    },
    orderBy: { updatedAt: 'desc' },
    take: 50,
  });
  res.json(games);
}

async function expireAndFinish(gameId: string, timedOutUserId: string, winnerId: string) {
  const [, , game] = await prisma.$transaction([
    prisma.user.update({ where: { id: timedOutUserId }, data: { losses: { increment: 1 } } }),
    prisma.user.update({ where: { id: winnerId }, data: { wins: { increment: 1 } } }),
    prisma.game.update({
      where: { id: gameId },
      data: { status: 'COMPLETED', winnerId, currentTurnId: null, turnStartedAt: null },
      include: {
        player1: { select: { id: true, username: true } },
        player2: { select: { id: true, username: true } },
        winner: { select: { id: true, username: true } },
      },
    }),
  ]);
  emitToGame(gameId, 'game:updated', { ...game, timeRemaining: 0 });
  return game;
}
