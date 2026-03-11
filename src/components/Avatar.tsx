interface AvatarProps {
  label: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'h-8 w-8 text-sm',
  md: 'h-[34px] w-[34px] text-base',
  lg: 'h-[72px] w-[72px] text-2xl',
};

export default function Avatar({ label, src = '', size = 'md' }: AvatarProps) {
  const letter = (label || '?').trim().charAt(0).toUpperCase();
  const baseClasses =
    'inline-flex flex-shrink-0 overflow-hidden rounded-full font-bold text-white bg-gradient-to-br from-sky-400 to-rose-500 items-center justify-center';
  const sizeClass = sizeClasses[size];
  if (src) {
    return (
      <span className={`${baseClasses} ${sizeClass}`}>
        <img src={src} alt={label || 'avatar'} className="h-full w-full object-cover" />
      </span>
    );
  }
  return <span className={`${baseClasses} ${sizeClass}`}>{letter}</span>;
}
