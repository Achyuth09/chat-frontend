import { useEffect, useState } from 'react';
import type { Socket } from 'socket.io-client';

export function useOnlineUsers(socket: Socket | null) {
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!socket) {
      setOnlineUserIds(new Set());
      return;
    }

    const onOnlineUsers = (payload: { userIds?: string[] }) => {
      const ids = Array.isArray(payload?.userIds) ? payload.userIds : [];
      setOnlineUserIds(new Set(ids));
    };

    const onUserOnline = (payload: { userId?: string }) => {
      const userId = payload?.userId;
      if (userId) {
        setOnlineUserIds((prev) => new Set(prev).add(userId));
      }
    };

    const onUserOffline = (payload: { userId?: string }) => {
      const userId = payload?.userId;
      if (userId) {
        setOnlineUserIds((prev) => {
          const next = new Set(prev);
          next.delete(userId);
          return next;
        });
      }
    };

    socket.on('online_users', onOnlineUsers);
    socket.on('user_online', onUserOnline);
    socket.on('user_offline', onUserOffline);

    return () => {
      socket.off('online_users', onOnlineUsers);
      socket.off('user_online', onUserOnline);
      socket.off('user_offline', onUserOffline);
    };
  }, [socket]);

  return { onlineUserIds };
}
