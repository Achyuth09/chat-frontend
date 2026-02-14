import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCallSignaling } from '../hooks/useCallSignaling';
import { useWebRTC } from '../hooks/useWebRTC';
import type { ChatUser } from '../types';
import VideoGrid from '../components/call/VideoGrid';
import CallControls from '../components/call/CallControls';

interface CallPageProps {
  token: string | null;
  user: ChatUser;
}

export default function CallPage({ token, user }: CallPageProps) {
  const { callRoomId = '' } = useParams();
  const navigate = useNavigate();
  const roomId = useMemo(() => decodeURIComponent(callRoomId), [callRoomId]);
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);

  const { participants, signaling } = useCallSignaling({ token, user, roomId });
  const { localStream, remoteEntries } = useWebRTC({ user, participants, signaling });

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
    navigate(-1);
  }

  return (
    <div className="app chat-view">
      <header className="chat-header">
        <span className="room-name">Call: {roomId}</span>
      </header>
      <VideoGrid localStream={localStream} remoteEntries={remoteEntries} myLabel={user.username} />
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
