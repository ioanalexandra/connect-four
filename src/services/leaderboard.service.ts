import api from './api';

export type LeaderboardEntry = {
  rank: number;
  id: string;
  username: string;
  wins: number;
  losses: number;
  draws: number;
  total: number;
  winRate: number;
};

export async function getLeaderboard() {
  const { data } = await api.get<LeaderboardEntry[]>('/leaderboard');
  return data;
}
