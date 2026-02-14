import { useEffect, useMemo, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { SOCKET_URL } from '../lib/config';
import type { ChatUser } from '../types';

interface UseCallSignalingArgs {
  token: string | null;
  user: ChatUser | null;
  roomId: string;
}

type SignalHandler = (payload: any) => void;

export function useCallSignaling({ token, user, roomId }: UseCallSignalingArgs) {
  const socketRef = useRef<Socket | null>(null);
  const [participants, setParticipants] = useState<string[]>([]);

  useEffect(() => {
    if (!token || !user || !roomId) return;
    const socket = io(SOCKET_URL, { auth: { token } });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join_room', roomId);
      socket.emit('call_join', { roomId });
    });
    socket.on('call_participants', (payload: { participants?: string[] }) => {
      setParticipants(Array.isArray(payload?.participants) ? payload.participants : []);
    });
    socket.on('call_joined', (payload: { userId?: string }) => {
      if (!payload?.userId) return;
      setParticipants((prev) => (prev.includes(payload.userId!) ? prev : [...prev, payload.userId!]));
    });
    socket.on('call_left', (payload: { userId?: string }) => {
      if (!payload?.userId) return;
      setParticipants((prev) => prev.filter((id) => id !== payload.userId));
    });
    socket.on('call_ended', () => {
      setParticipants([]);
    });

    return () => {
      socket.emit('call_leave', { roomId });
      socket.off('call_participants');
      socket.off('call_joined');
      socket.off('call_left');
      socket.off('call_ended');
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, user, roomId]);

  const signaling = useMemo(
    () => ({
      emitOffer: (targetUserId: string, sdp: RTCSessionDescriptionInit) =>
        socketRef.current?.emit('webrtc_offer', { roomId, targetUserId, sdp }),
      emitAnswer: (targetUserId: string, sdp: RTCSessionDescriptionInit) =>
        socketRef.current?.emit('webrtc_answer', { roomId, targetUserId, sdp }),
      emitCandidate: (targetUserId: string, candidate: RTCIceCandidateInit) =>
        socketRef.current?.emit('webrtc_ice_candidate', { roomId, targetUserId, candidate }),
      on: (event: 'webrtc_offer' | 'webrtc_answer' | 'webrtc_ice_candidate', handler: SignalHandler) =>
        socketRef.current?.on(event, handler),
      off: (event: 'webrtc_offer' | 'webrtc_answer' | 'webrtc_ice_candidate', handler: SignalHandler) =>
        socketRef.current?.off(event, handler),
      endCall: () => socketRef.current?.emit('call_end', { roomId }),
    }),
    [roomId]
  );

  return { participants, signaling };
}
