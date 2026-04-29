import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from 'jwt-decode';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { registerLogoutCallback } from '@/services/api';
import {
  login as apiLogin,
  logout as apiLogout,
  register as apiRegister,
} from '@/services/auth.service';

type AuthContextType = {
  isAuthenticated: boolean;
  isLoading: boolean;
  userId: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, username: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

function decodeUserId(token: string): string | null {
  try {
    const { sub } = jwtDecode<{ sub: string }>(token);
    return sub ?? null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const logout = useCallback(async () => {
    await apiLogout();
    setIsAuthenticated(false);
    setUserId(null);
  }, []);

  useEffect(() => {
    registerLogoutCallback(logout);
  }, [logout]);

  useEffect(() => {
    SecureStore.getItemAsync('accessToken').then(token => {
      if (token) {
        setUserId(decodeUserId(token));
        setIsAuthenticated(true);
      }
      setIsLoading(false);
    });
  }, []);

  const login = async (email: string, password: string) => {
    const tokens = await apiLogin(email, password);
    setUserId(decodeUserId(tokens.accessToken));
    setIsAuthenticated(true);
  };

  const register = async (email: string, password: string, username: string) => {
    const tokens = await apiRegister(email, password, username);
    setUserId(decodeUserId(tokens.accessToken));
    setIsAuthenticated(true);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, userId, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
