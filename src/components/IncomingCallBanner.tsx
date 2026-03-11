import type { IncomingCall } from '../hooks/useIncomingCall';

interface IncomingCallBannerProps {
  incomingCall: IncomingCall;
  onAccept: () => void;
  onReject: () => void;
}

export default function IncomingCallBanner({ incomingCall, onAccept, onReject }: IncomingCallBannerProps) {
  return (
    <div className="fixed right-3.5 top-3.5 z-[80] min-w-[230px] rounded-xl border border-sky-200/30 bg-white/95 p-3 shadow-lg">
      <div>
        <strong>{incomingCall.from?.username || 'Someone'}</strong> is calling...
      </div>
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={onAccept}
          className="cursor-pointer rounded-lg border-0 bg-green-500 px-2.5 py-1.5 font-bold text-[#0d1117]"
        >
          Accept
        </button>
        <button
          type="button"
          onClick={onReject}
          className="danger-btn cursor-pointer rounded-lg border-0 bg-red-500 px-2.5 py-1.5 font-bold text-white"
        >
          Reject
        </button>
      </div>
    </div>
  );
}
