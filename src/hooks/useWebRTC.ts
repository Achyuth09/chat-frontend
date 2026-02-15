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
  const reinitInFlightRef = useRef(false);

  async function replaceLocalStream(nextStream: MediaStream) {
    const peers = Object.values(peersRef.current);
    for (const pc of peers) {
      const senders = pc.getSenders();
      const nextAudio = nextStream.getAudioTracks()[0] || null;
      const nextVideo = nextStream.getVideoTracks()[0] || null;
      for (const sender of senders) {
        const kind = sender.track?.kind;
        if (kind === 'audio') {
          await sender.replaceTrack(nextAudio);
        } else if (kind === 'video') {
          await sender.replaceTrack(nextVideo);
        }
      }
    }
    setLocalStream((prev) => {
      prev?.getTracks().forEach((t) => t.stop());
      return nextStream;
    });
  }

  async function reinitializeLocalMediaIfNeeded(force = false) {
    if (!user) return;
    if (reinitInFlightRef.current) return;
    const audioTracks = localStream?.getAudioTracks() || [];
    const videoTracks = localStream?.getVideoTracks() || [];
    const needsReinit =
      force ||
      !localStream ||
      audioTracks.length === 0 ||
      videoTracks.length === 0 ||
      [...audioTracks, ...videoTracks].some((t) => t.readyState === 'ended');
    if (!needsReinit) return;

    reinitInFlightRef.current = true;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      await replaceLocalStream(stream);
    } catch {
      // ignore; user can still continue with existing tracks or retry by toggling devices
    } finally {
      reinitInFlightRef.current = false;
    }
  }

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

  useEffect(() => {
    function onVisibilityOrFocus() {
      if (document.visibilityState === 'visible') {
        reinitializeLocalMediaIfNeeded(false);
      }
    }
    document.addEventListener('visibilitychange', onVisibilityOrFocus);
    window.addEventListener('focus', onVisibilityOrFocus);
    window.addEventListener('pageshow', onVisibilityOrFocus);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityOrFocus);
      window.removeEventListener('focus', onVisibilityOrFocus);
      window.removeEventListener('pageshow', onVisibilityOrFocus);
    };
  }, [localStream, user]);

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
