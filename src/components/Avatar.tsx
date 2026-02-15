interface AvatarProps {
  label: string;
  src?: string;
}

export default function Avatar({ label, src = '' }: AvatarProps) {
  const letter = (label || '?').trim().charAt(0).toUpperCase();
  if (src) {
    return (
      <span className="avatar">
        <img src={src} alt={label || 'avatar'} />
      </span>
    );
  }
  return <span className="avatar">{letter}</span>;
}
