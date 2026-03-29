import { Loader2 } from 'lucide-react';

interface LoaderProps {
  text?: string;
  className?: string;
}

export default function Loader({ text = 'Loading...', className = '' }: LoaderProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-[var(--text-muted)] gap-3 ${className}`}>
      <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
      {text && <p className="text-sm font-medium">{text}</p>}
    </div>
  );
}
