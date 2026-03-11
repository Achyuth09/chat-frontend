import { useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { SOCKET_URL } from '../lib/config';
import type { ChatUser } from '../types';

interface UseAppSocketArgs {
  token: string | null;
  user: ChatUser | null;
}

export function useAppSocket({ token, user }: UseAppSocketArgs) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!token || !user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
      }
      return;
    }

    const s = io(SOCKET_URL, { auth: { token } });
    socketRef.current = s;
    setSocket(s);

    return () => {
      s.disconnect();
      socketRef.current = null;
      setSocket(null);
    };
  }, [token, user?.id]);

  return { socket };
}
