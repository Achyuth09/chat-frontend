import { useEffect, useRef } from 'react';

interface VideoTileProps {
  stream: MediaStream | null;
  muted?: boolean;
  label: string;
}

function VideoTile({ stream, muted = false, label }: VideoTileProps) {
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
    <div className="video-tile">
      <video ref={ref} autoPlay playsInline muted={muted} />
      <span>{label}</span>
    </div>
  );
}

interface VideoGridProps {
  localStream: MediaStream | null;
  remoteEntries: Array<[string, MediaStream]>;
  myLabel: string;
}

export default function VideoGrid({ localStream, remoteEntries, myLabel }: VideoGridProps) {
  return (
    <section className="video-grid">
      <VideoTile stream={localStream} muted label={`${myLabel} (You)`} />
      {remoteEntries.map(([userId, stream]) => (
        <VideoTile key={userId} stream={stream} label={userId} />
      ))}
    </section>
  );
}
