import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

function hasUserInteraction(): boolean {
  const ua = (navigator as Navigator & { userActivation?: { hasBeenActive?: boolean } }).userActivation;
  if (typeof ua?.hasBeenActive === 'boolean') return ua.hasBeenActive;
  return false;
}

function stopVibrationIfAllowed() {
  if (!('vibrate' in navigator) || !hasUserInteraction()) return;
  try {
    navigator.vibrate(0);
  } catch {
    // ignore browser intervention warnings
  }
}

function playRingTone() {
  if (!hasUserInteraction()) return;
  const AudioCtx =
    window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return;
  const ctx = new AudioCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = 880;
  gain.gain.setValueAtTime(0.0001, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.38);
  window.setTimeout(() => {
    ctx.close().catch(() => {
      // ignore
    });
  }, 500);
}

interface UseCallRingtoneArgs {
  incomingCall: { roomId: string } | null;
}

export function useCallRingtone({ incomingCall }: UseCallRingtoneArgs) {
  const location = useLocation();
  const ringIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!incomingCall || location.pathname.startsWith('/call/')) {
      if (ringIntervalRef.current) {
        window.clearInterval(ringIntervalRef.current);
        ringIntervalRef.current = null;
      }
      stopVibrationIfAllowed();
      return;
    }

    playRingTone();
    ringIntervalRef.current = window.setInterval(playRingTone, 1500);
    if ('vibrate' in navigator && hasUserInteraction()) {
      try {
        navigator.vibrate([200, 120, 200]);
      } catch {
        // ignore browser intervention warnings
      }
    }

    return () => {
      if (ringIntervalRef.current) {
        window.clearInterval(ringIntervalRef.current);
        ringIntervalRef.current = null;
      }
      stopVibrationIfAllowed();
    };
  }, [incomingCall, location.pathname]);
}
