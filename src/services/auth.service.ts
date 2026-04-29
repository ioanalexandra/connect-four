import * as SecureStore from 'expo-secure-store';
import api from './api';

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export async function login(email: string, password: string): Promise<AuthTokens> {
  const { data } = await api.post<AuthTokens>('/auth/login', { email, password });
  await saveTokens(data);
  return data;
}

export async function register(
  email: string,
  password: string,
  username: string,
): Promise<AuthTokens> {
  const { data } = await api.post<AuthTokens>('/auth/register', { email, password, username });
  await saveTokens(data);
  return data;
}

export async function refreshTokens(): Promise<AuthTokens> {
  const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  if (!refreshToken) throw new Error('No refresh token stored');
  const { data } = await api.post<AuthTokens>('/auth/refresh', { refreshToken });
  await saveTokens(data);
  return data;
}

export async function logout() {
  await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
}

async function saveTokens(tokens: AuthTokens) {
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, tokens.accessToken);
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refreshToken);
}
