interface CallControlsProps {
  micEnabled: boolean;
  cameraEnabled: boolean;
  onMiniView: () => void;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onEndCall: () => void;
}

export default function CallControls({
  micEnabled,
  cameraEnabled,
  onMiniView,
  onToggleMic,
  onToggleCamera,
  onEndCall,
}: CallControlsProps) {
  return (
    <div className="call-controls">
      <button type="button" onClick={onMiniView}>
        Mini View
      </button>
      <button type="button" onClick={onToggleMic}>
        {micEnabled ? 'Mute Mic' : 'Unmute Mic'}
      </button>
      <button type="button" onClick={onToggleCamera}>
        {cameraEnabled ? 'Camera Off' : 'Camera On'}
      </button>
      <button type="button" className="danger-btn" onClick={onEndCall}>
        End Call
      </button>
    </div>
  );
}
