interface AvatarProps {
  label: string;
}

export default function Avatar({ label }: AvatarProps) {
  const letter = (label || '?').trim().charAt(0).toUpperCase();
  return <span className="avatar">{letter}</span>;
}
