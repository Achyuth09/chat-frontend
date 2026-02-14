import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCallSignaling } from '../hooks/useCallSignaling';
import { useWebRTC } from '../hooks/useWebRTC';
import type { ChatUser } from '../types';
import VideoGrid from '../components/call/VideoGrid';
import CallControls from '../components/call/CallControls';

interface CallPageProps {
  token: string | null;
  user: ChatUser;
  users: ChatUser[];
}

export default function CallPage({ token, user, users }: CallPageProps) {
  const { callRoomId = '' } = useParams();
  const navigate = useNavigate();
  const roomId = useMemo(() => decodeURIComponent(callRoomId), [callRoomId]);
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);

  const { participants, signaling, callEnded } = useCallSignaling({ token, user, roomId });
  const { localStream, remoteEntries } = useWebRTC({ user, participants, signaling });
  const nameById = useMemo(() => {
    const entries = [user, ...users].map((u) => [u.id, u.username] as const);
    return Object.fromEntries(entries);
  }, [user, users]);
  const remoteTiles = useMemo(
    () =>
      remoteEntries.map(([id, stream]) => ({
        id,
        stream,
        label: nameById[id] || id,
      })),
    [remoteEntries, nameById]
  );

  function toggleMic() {
    if (!localStream) return;
    localStream.getAudioTracks().forEach((track) => {
      track.enabled = !track.enabled;
      setMicEnabled(track.enabled);
    });
  }

  function toggleCamera() {
    if (!localStream) return;
    localStream.getVideoTracks().forEach((track) => {
      track.enabled = !track.enabled;
      setCameraEnabled(track.enabled);
    });
  }

  function endCall() {
    signaling.endCall();
    navigate('/messages');
  }

  useEffect(() => {
    if (!callEnded) return;
    navigate('/messages');
  }, [callEnded, navigate]);

  return (
    <div className="app chat-view">
      <header className="chat-header">
        <span className="room-name">Call: {roomId}</span>
      </header>
      <VideoGrid
        localStream={localStream}
        remoteEntries={remoteTiles}
        myLabel={user.username}
        localMicEnabled={micEnabled}
        localCameraEnabled={cameraEnabled}
      />
      <CallControls
        micEnabled={micEnabled}
        cameraEnabled={cameraEnabled}
        onToggleMic={toggleMic}
        onToggleCamera={toggleCamera}
        onEndCall={endCall}
      />
    </div>
  );
}
