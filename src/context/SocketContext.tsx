import * as SecureStore from 'expo-secure-store';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SERVER_URL = 'http://localhost:3000';

export type OnlineUser = { id: string; username: string };
export type IncomingChallenge = { challengerId: string; challengerUsername: string } | null;

type SocketContextType = {
  socket: Socket | null;
  onlineUsers: OnlineUser[];
  incomingChallenge: IncomingChallenge;
  clearChallenge: () => void;
};

const SocketContext = createContext<SocketContextType | null>(null);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [incomingChallenge, setIncomingChallenge] = useState<IncomingChallenge>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    SecureStore.getItemAsync('accessToken').then(token => {
      if (!token) return;

      const s = io(SERVER_URL, {
        auth: { token },
        transports: ['websocket'],
        reconnection: true,
      });

      s.on('users:online', (users: OnlineUser[]) => setOnlineUsers(users));
      s.on('challenge:received', (data: { challengerId: string; challengerUsername: string }) => {
        setIncomingChallenge(data);
      });
      s.on('challenge:cancelled', () => setIncomingChallenge(null));

      socketRef.current = s;
      setSocket(s);
    });

    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setSocket(null);
      setOnlineUsers([]);
      setIncomingChallenge(null);
    };
  }, [isAuthenticated]);

  const clearChallenge = useCallback(() => setIncomingChallenge(null), []);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers, incomingChallenge, clearChallenge }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within SocketProvider');
  return ctx;
}
