import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { Socket } from 'socket.io-client';
import type { ChatUser } from '../types';

export interface IncomingCall {
  roomId: string;
  from?: { id?: string; username?: string };
}

interface UseIncomingCallArgs {
  socket: Socket | null;
  user: ChatUser | null;
}

export function useIncomingCall({ socket, user }: UseIncomingCallArgs) {
  const navigate = useNavigate();
  const location = useLocation();
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const socketRef = useRef(socket);
  socketRef.current = socket;
  const pathRef = useRef(location.pathname);
  useEffect(() => {
    pathRef.current = location.pathname;
  }, [location.pathname]);

  useEffect(() => {
    if (!socket || !user) return;

    const handler = (payload: { roomId?: string; from?: { id?: string; username?: string } }) => {
      if (!payload?.roomId) return;
      if (payload.from?.id && payload.from.id === user.id) return;
      if (pathRef.current.startsWith('/call/')) return;
      setIncomingCall({ roomId: payload.roomId, from: payload.from });
    };

    socket.on('incoming_call', handler);
    socket.on('call_accept', (p: { roomId?: string }) => {
      if (!p?.roomId) return;
      setIncomingCall((prev) => (prev?.roomId === p.roomId ? null : prev));
    });
    socket.on('call_reject', (p: { roomId?: string }) => {
      if (!p?.roomId) return;
      setIncomingCall((prev) => (prev?.roomId === p.roomId ? null : prev));
    });
    socket.on('call_ended', (p: { roomId?: string }) => {
      if (!p?.roomId) return;
      setIncomingCall((prev) => (prev?.roomId === p.roomId ? null : prev));
    });

    return () => {
      socket.off('incoming_call', handler);
      socket.off('call_accept');
      socket.off('call_reject');
      socket.off('call_ended');
    };
  }, [socket, user]);

  function acceptIncomingCall() {
    if (!incomingCall?.roomId) return;
    socketRef.current?.emit('call_accept', { roomId: incomingCall.roomId });
    navigate(`/call/${encodeURIComponent(incomingCall.roomId)}`);
    setIncomingCall(null);
  }

  function rejectIncomingCall() {
    if (!incomingCall?.roomId) return;
    socketRef.current?.emit('call_reject', { roomId: incomingCall.roomId });
    setIncomingCall(null);
  }

  function startCall(roomIdToCall: string) {
    if (!roomIdToCall) return;
    setIncomingCall(null);
    socketRef.current?.emit('call_invite', { roomId: roomIdToCall });
    navigate(`/call/${encodeURIComponent(roomIdToCall)}`);
  }

  function clearIncomingCall() {
    setIncomingCall(null);
  }

  return {
    incomingCall,
    setIncomingCall,
    acceptIncomingCall,
    rejectIncomingCall,
    startCall,
    clearIncomingCall,
  };
}
