import { useEffect, useRef } from 'react';

interface VideoTileProps {
  stream: MediaStream | null;
  muted?: boolean;
  label: string;
  isLocal?: boolean;
  showMicOff?: boolean;
  showCamOff?: boolean;
}

function VideoTile({
  stream,
  muted = false,
  label,
  isLocal = false,
  showMicOff = false,
  showCamOff = false,
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
    <div className={`video-tile${isLocal ? ' local' : ''}`}>
      <video ref={ref} autoPlay playsInline muted={muted} />
      {(showMicOff || showCamOff) && (
        <div className="tile-badges">
          {showMicOff && <span className="tile-badge">Mic Off</span>}
          {showCamOff && <span className="tile-badge">Camera Off</span>}
        </div>
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
}

export default function VideoGrid({
  localStream,
  remoteEntries,
  myLabel,
  localMicEnabled,
  localCameraEnabled,
}: VideoGridProps) {
  return (
    <section className="video-grid">
      <VideoTile
        stream={localStream}
        muted
        label={`${myLabel} (You)`}
        isLocal
        showMicOff={!localMicEnabled}
        showCamOff={!localCameraEnabled}
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
