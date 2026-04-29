import http from 'http';
import { Server, Socket } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt';
import prisma from '../utils/prisma';

export type AuthSocket = Socket & { data: { userId: string; username: string } };

let io: Server | null = null;

export function getIO(): Server {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
}

export function emitToUser(userId: string, event: string, data: unknown) {
  try {
    getIO().to(`user:${userId}`).emit(event, data);
  } catch {
    // server may not be initialized in tests
  }
}

export function emitToGame(gameId: string, event: string, data: unknown) {
  try {
    getIO().to(`game:${gameId}`).emit(event, data);
  } catch {
    // server may not be initialized in tests
  }
}

export function setupSocket(server: http.Server) {
  io = new Server(server, {
    cors: { origin: '*' },
    transports: ['websocket', 'polling'],
  });

  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token as string;
    if (!token) {
      next(new Error('No token'));
      return;
    }
    try {
      const payload = verifyAccessToken(token);
      const user = await prisma.user.findUnique({
        where: { id: payload.sub as string },
        select: { id: true, username: true },
      });
      if (!user) {
        next(new Error('User not found'));
        return;
      }
      (socket as AuthSocket).data = { userId: user.id, username: user.username };
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const { userId, username } = (socket as AuthSocket).data;

    socket.join(`user:${userId}`);
    broadcastOnlineUsers();

    socket.on('game:join', ({ gameId }: { gameId: string }) => {
      socket.join(`game:${gameId}`);
    });

    socket.on('game:leave', ({ gameId }: { gameId: string }) => {
      socket.leave(`game:${gameId}`);
    });

    socket.on('challenge:send', ({ targetUserId }: { targetUserId: string }) => {
      io!
        .to(`user:${targetUserId}`)
        .emit('challenge:received', { challengerId: userId, challengerUsername: username });
    });

    socket.on('challenge:cancel', ({ targetUserId }: { targetUserId: string }) => {
      io!.to(`user:${targetUserId}`).emit('challenge:cancelled', { challengerId: userId });
    });

    socket.on('challenge:decline', ({ challengerId }: { challengerId: string }) => {
      io!.to(`user:${challengerId}`).emit('challenge:declined', { declinedBy: username });
    });

    socket.on('disconnect', () => {
      broadcastOnlineUsers();
    });
  });

  return io;
}

async function broadcastOnlineUsers() {
  if (!io) return;
  const sockets = await io.fetchSockets();
  const users = sockets
    .map(s => ({
      id: (s as unknown as AuthSocket).data?.userId,
      username: (s as unknown as AuthSocket).data?.username,
    }))
    .filter(u => u.id);
  const unique = Array.from(new Map(users.map(u => [u.id, u])).values());
  io.emit('users:online', unique);
}
