import { useEffect, useRef } from 'react';

interface VideoTileProps {
  stream: MediaStream | null;
  muted?: boolean;
  label: string;
  isLocal?: boolean;
  showMicOff?: boolean;
  showCamOff?: boolean;
  onMiniView?: () => void;
  className?: string;
}

function VideoTile({
  stream,
  muted = false,
  label,
  isLocal = false,
  showMicOff = false,
  showCamOff = false,
  onMiniView,
  className = '',
}: VideoTileProps) {
  const ref = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.srcObject = stream || null;
    if (stream) {
      ref.current
        .play()
        .catch(() => {
          // Browser autoplay policy can block unmuted streams.
        });
    }
  }, [stream]);

  return (
    <div className={`video-tile${isLocal ? ' local' : ''}${className ? ` ${className}` : ''}`}>
      <video ref={ref} autoPlay playsInline muted={muted} />
      {(showMicOff || showCamOff) && (
        <div className="tile-badges">
          {showMicOff && <span className="tile-badge">Mic Off</span>}
          {showCamOff && <span className="tile-badge">Camera Off</span>}
        </div>
      )}
      {isLocal && onMiniView && (
        <button type="button" className="tile-mini-btn" onClick={onMiniView} title="Minimize to picture-in-picture">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm1 2v10h14V7H5Zm8 4h5v4h-5v-4Z"
              fill="currentColor"
            />
          </svg>
        </button>
      )}
      <span>{label}</span>
    </div>
  );
}

interface VideoGridProps {
  localStream: MediaStream | null;
  remoteEntries: Array<{ id: string; stream: MediaStream; label: string }>;
  myLabel: string;
  localMicEnabled: boolean;
  localCameraEnabled: boolean;
  onMiniView: () => void;
  isDirectCall?: boolean;
}

export default function VideoGrid({
  localStream,
  remoteEntries,
  myLabel,
  localMicEnabled,
  localCameraEnabled,
  onMiniView,
  isDirectCall = false,
}: VideoGridProps) {
  const primaryRemote = remoteEntries[0] || null;

  if (isDirectCall) {
    return (
      <section className="video-grid direct-call-layout">
        {primaryRemote ? (
          <>
            <VideoTile
              stream={primaryRemote.stream}
              muted={false}
              label={primaryRemote.label}
              className="primary"
            />
            <div className="local-floating-wrap">
              <VideoTile
                stream={localStream}
                muted
                label={`${myLabel} (You)`}
                isLocal
                showMicOff={!localMicEnabled}
                showCamOff={!localCameraEnabled}
                onMiniView={onMiniView}
              />
            </div>
          </>
        ) : (
          <VideoTile
            stream={localStream}
            muted
            label={`${myLabel} (You)`}
            isLocal
            showMicOff={!localMicEnabled}
            showCamOff={!localCameraEnabled}
            onMiniView={onMiniView}
            className="primary"
          />
        )}
      </section>
    );
  }

  return (
    <section className="video-grid">
      <VideoTile
        stream={localStream}
        muted
        label={`${myLabel} (You)`}
        isLocal
        showMicOff={!localMicEnabled}
        showCamOff={!localCameraEnabled}
        onMiniView={onMiniView}
      />
      {remoteEntries.map((entry) => (
        <VideoTile
          key={entry.id}
          stream={entry.stream}
          muted={false}
          label={entry.label}
        />
      ))}
    </section>
  );
}
