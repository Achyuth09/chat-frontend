export function dmRoomId(myId: string, otherId: string): string {
  const [a, b] = [myId, otherId].sort();
  return `dm:${a}:${b}`;
}

export function getOtherUserIdFromDmRoom(roomId: string, myId: string): string | null {
  const parts = String(roomId || '').split(':');
  if (parts.length !== 3 || parts[0] !== 'dm') return null;
  const [a, b] = [parts[1], parts[2]];
  return a === myId ? b : b === myId ? a : null;
}
