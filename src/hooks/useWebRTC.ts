import { useEffect, useMemo, useRef, useState } from 'react';
import { RTC_CONFIG } from '../lib/config';
import type { ChatUser } from '../types';

interface UseWebRTCArgs {
  user: ChatUser | null;
  participants: string[];
  signaling: {
    emitOffer: (targetUserId: string, sdp: RTCSessionDescriptionInit) => void;
    emitAnswer: (targetUserId: string, sdp: RTCSessionDescriptionInit) => void;
    emitCandidate: (targetUserId: string, candidate: RTCIceCandidateInit) => void;
    on: (event: 'webrtc_offer' | 'webrtc_answer' | 'webrtc_ice_candidate', handler: (payload: any) => void) => void;
    off: (event: 'webrtc_offer' | 'webrtc_answer' | 'webrtc_ice_candidate', handler: (payload: any) => void) => void;
  };
}

export function useWebRTC({ user, participants, signaling }: UseWebRTCArgs) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});
  const peersRef = useRef<Record<string, RTCPeerConnection>>({});

  useEffect(() => {
    let mounted = true;
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        if (!mounted) return;
        setLocalStream(stream);
      })
      .catch(() => {
        setLocalStream(null);
      });
    return () => {
      mounted = false;
    };
  }, []);

  async function ensurePeer(remoteUserId: string) {
    if (!localStream || !user) return null;
    if (peersRef.current[remoteUserId]) return peersRef.current[remoteUserId];

    const pc = new RTCPeerConnection(RTC_CONFIG);
    localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));
    pc.ontrack = (event) => {
      const stream = event.streams[0];
      if (!stream) return;
      setRemoteStreams((prev) => ({ ...prev, [remoteUserId]: stream }));
    };
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        signaling.emitCandidate(remoteUserId, event.candidate.toJSON());
      }
    };
    peersRef.current[remoteUserId] = pc;
    return pc;
  }

  useEffect(() => {
    if (!localStream || !user) return;
    const others = participants.filter((id) => id !== user.id);
    others.forEach(async (remoteUserId) => {
      if (user.id > remoteUserId) return;
      const pc = await ensurePeer(remoteUserId);
      if (!pc) return;
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      signaling.emitOffer(remoteUserId, offer);
    });
  }, [participants, localStream, user]);

  useEffect(() => {
    const handleOffer = async (payload: any) => {
      if (!user) return;
      if (payload?.targetUserId !== user.id) return;
      const remoteUserId = payload.fromUserId;
      const pc = await ensurePeer(remoteUserId);
      if (!pc) return;
      await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      signaling.emitAnswer(remoteUserId, answer);
    };

    const handleAnswer = async (payload: any) => {
      if (!user) return;
      if (payload?.targetUserId !== user.id) return;
      const pc = peersRef.current[payload.fromUserId];
      if (!pc) return;
      await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
    };

    const handleCandidate = async (payload: any) => {
      if (!user) return;
      if (payload?.targetUserId !== user.id) return;
      const pc = peersRef.current[payload.fromUserId];
      if (!pc) return;
      await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
    };

    signaling.on('webrtc_offer', handleOffer);
    signaling.on('webrtc_answer', handleAnswer);
    signaling.on('webrtc_ice_candidate', handleCandidate);
    return () => {
      signaling.off('webrtc_offer', handleOffer);
      signaling.off('webrtc_answer', handleAnswer);
      signaling.off('webrtc_ice_candidate', handleCandidate);
    };
  }, [signaling, user, localStream]);

  useEffect(() => {
    return () => {
      Object.values(peersRef.current).forEach((pc) => pc.close());
      peersRef.current = {};
      if (localStream) localStream.getTracks().forEach((t) => t.stop());
    };
  }, [localStream]);

  const remoteEntries = useMemo(() => Object.entries(remoteStreams), [remoteStreams]);
  return { localStream, remoteEntries };
}
