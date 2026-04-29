import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export async function getLeaderboard(_req: Request, res: Response) {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      gamesAsPlayer1: {
        where: { status: { in: ['COMPLETED', 'DRAW', 'ABANDONED'] } },
        select: { status: true, winnerId: true },
      },
      gamesAsPlayer2: {
        where: { status: { in: ['COMPLETED', 'DRAW', 'ABANDONED'] } },
        select: { status: true, winnerId: true },
      },
    },
  });

  type GameResult = { status: string; winnerId: string | null };

  const leaderboard = users
    .map(u => {
      const all: GameResult[] = [...u.gamesAsPlayer1, ...u.gamesAsPlayer2];
      const wins = all.filter(g => g.winnerId === u.id).length;
      const draws = all.filter(g => g.status === 'DRAW').length;
      const losses = all.filter(
        g => g.status !== 'DRAW' && g.winnerId !== null && g.winnerId !== u.id,
      ).length;
      const total = wins + losses + draws;
      return {
        id: u.id,
        username: u.username,
        wins,
        losses,
        draws,
        total,
        winRate: total > 0 ? Math.round((wins / total) * 100) : 0,
      };
    })
    .filter(u => u.total > 0)
    .sort((a, b) => b.wins - a.wins || a.losses - b.losses)
    .map((u, i) => ({ rank: i + 1, ...u }));

  res.json(leaderboard);
}
