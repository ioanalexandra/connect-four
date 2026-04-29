import api from './api';

export type Player = { id: string; username: string };

export type GameState = {
  id: string;
  status: 'WAITING' | 'IN_PROGRESS' | 'COMPLETED' | 'DRAW' | 'ABANDONED';
  board: number[][];
  player1: Player;
  player2: Player | null;
  currentTurnId: string | null;
  winnerId: string | null;
  winner: Player | null;
  turnStartedAt: string | null;
  timeRemaining: number | null;
  createdAt: string;
};

export type Move = {
  id: string;
  column: number;
  row: number;
  moveNumber: number;
  player: Player;
  createdAt: string;
};

export async function createGame() {
  const { data } = await api.post<GameState>('/games/create');
  return data;
}

export async function joinGame() {
  const { data } = await api.post<GameState>('/games/join');
  return data;
}

export async function getGame(gameId: string) {
  const { data } = await api.get<GameState>(`/games/${gameId}`);
  return data;
}

export async function getActiveGame() {
  const { data } = await api.get<GameState>('/games/active');
  return data;
}

export async function makeMove(gameId: string, column: number) {
  const { data } = await api.post<GameState>(`/games/${gameId}/move`, { column });
  return data;
}

export async function forfeitGame(gameId: string) {
  await api.post(`/games/${gameId}/forfeit`);
}

export async function getHistory(gameId: string) {
  const { data } = await api.get<{ game: GameState; moves: Move[] }>(`/games/${gameId}/history`);
  return data;
}

export async function acceptChallenge(challengerId: string) {
  const { data } = await api.post<GameState>('/games/challenge/accept', { challengerId });
  return data;
}

export async function getMyGames() {
  const { data } = await api.get<GameState[]>('/games/history');
  return data;
}
