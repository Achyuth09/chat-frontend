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
        {micEnabled ? (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M12 3.5a3 3 0 0 1 3 3v5a3 3 0 1 1-6 0v-5a3 3 0 0 1 3-3Zm-6 8a1 1 0 0 1 1 1 5 5 0 0 0 10 0 1 1 0 1 1 2 0 7 7 0 0 1-6 6.92V22h-2v-2.58A7 7 0 0 1 5 12.5a1 1 0 0 1 1-1Z"
              fill="currentColor"
            />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="m4.7 3.3 16 16-1.4 1.4-3.1-3.1A6.95 6.95 0 0 1 13 19.42V22h-2v-2.58A7 7 0 0 1 5 12.5a1 1 0 1 1 2 0 5 5 0 0 0 5 5c.94 0 1.83-.26 2.58-.72L9.2 11.4a3.03 3.03 0 0 1-.2-1.1v-3a3 3 0 0 1 5.12-2.12l5.17 5.17a1 1 0 0 1-1.41 1.41l-1.88-1.88v2.62c0 1.08-.25 2.1-.7 3l-1.5-1.5c.12-.48.2-.98.2-1.5V6.5a1 1 0 1 0-2 0v3L3.3 4.7l1.4-1.4Z"
              fill="currentColor"
            />
          </svg>
        )}
      </button>
      <button
        type="button"
        onClick={onToggleCamera}
        title={cameraEnabled ? 'Turn camera off' : 'Turn camera on'}
      >
        {cameraEnabled ? (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M4 7.5A2.5 2.5 0 0 1 6.5 5h7A2.5 2.5 0 0 1 16 7.5V9l3.9-2.1A1 1 0 0 1 21.3 7.8v8.4a1 1 0 0 1-1.4.9L16 15v1.5a2.5 2.5 0 0 1-2.5 2.5h-7A2.5 2.5 0 0 1 4 16.5v-9Z"
              fill="currentColor"
            />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="m3.3 2 18.7 18.7-1.3 1.3-3.2-3.2H6.5A2.5 2.5 0 0 1 4 16.3V7.7a2.5 2.5 0 0 1 2.5-2.5h4.8L2 3.3 3.3 2Zm12.7 10.7 3.6 2V9.3L16 11.2v1.5ZM13.5 5.2c.92 0 1.72.49 2.16 1.22L21.2 3a1 1 0 0 1 1.3.88v12.24a1 1 0 0 1-1.4.9l-2.16-1.08.66-.66V8.12L16 10.08V7.7c0-.83-.4-1.56-1.02-2.01l-1.48-.49Z"
              fill="currentColor"
            />
          </svg>
        )}
      </button>
      <button type="button" className="danger-btn" onClick={onEndCall} title="End call">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M5.1 15.2c2.2-1.8 4.5-2.7 6.9-2.7s4.7.9 6.9 2.7l1.1-1.1a1 1 0 0 0 .2-1.2c-.8-1.6-2.2-2.9-3.9-3.5l-2.5-.9a1 1 0 0 0-1.1.3l-1 1.2a1 1 0 0 1-1.5 0l-1-1.2a1 1 0 0 0-1.1-.3l-2.5.9A6.73 6.73 0 0 0 3.8 13a1 1 0 0 0 .2 1.2l1.1 1Z"
            fill="currentColor"
          />
        </svg>
      </button>
    </div>
  );
}
