import { Mic, MicOff, PhoneOff, Video, VideoOff } from 'lucide-react';

interface CallControlsProps {
  micEnabled: boolean;
  cameraEnabled: boolean;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onEndCall: () => void;
}

export default function CallControls({
  micEnabled,
  cameraEnabled,
  onToggleMic,
  onToggleCamera,
  onEndCall,
}: CallControlsProps) {
  return (
    <div className="call-controls">
      <button type="button" onClick={onToggleMic} title={micEnabled ? 'Mute mic' : 'Unmute mic'}>
        {micEnabled ? <Mic size={21} /> : <MicOff size={21} />}
      </button>
      <button
        type="button"
        onClick={onToggleCamera}
        title={cameraEnabled ? 'Turn camera off' : 'Turn camera on'}
      >
        {cameraEnabled ? <Video size={21} /> : <VideoOff size={21} />}
      </button>
      <button type="button" className="danger-btn" onClick={onEndCall} title="End call">
        <PhoneOff size={21} />
      </button>
    </div>
  );
}
