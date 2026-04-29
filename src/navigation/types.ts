import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainStackParamList = {
  Home: undefined;
  Lobby: undefined;
  Game: { gameId: string };
  Leaderboard: undefined;
  GameHistory: { gameId: string };
  MyGames: undefined;
};

export type LoginScreenProps = NativeStackScreenProps<AuthStackParamList, 'Login'>;
export type RegisterScreenProps = NativeStackScreenProps<AuthStackParamList, 'Register'>;
export type HomeScreenProps = NativeStackScreenProps<MainStackParamList, 'Home'>;
export type LobbyScreenProps = NativeStackScreenProps<MainStackParamList, 'Lobby'>;
export type MyGamesScreenProps = NativeStackScreenProps<MainStackParamList, 'MyGames'>;
export type GameScreenProps = NativeStackScreenProps<MainStackParamList, 'Game'>;
export type LeaderboardScreenProps = NativeStackScreenProps<MainStackParamList, 'Leaderboard'>;
export type GameHistoryScreenProps = NativeStackScreenProps<MainStackParamList, 'GameHistory'>;
