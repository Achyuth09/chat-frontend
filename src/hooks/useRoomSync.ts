import { useCallback, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { dmRoomId } from '../utils/chat';
import type { ChatUser, Group } from '../types';

interface UseRoomSyncArgs {
  user: ChatUser | null;
  users: ChatUser[];
  groups: Group[];
  setRoomId: (id: string) => void;
  setRoomLabel: (label: string) => void;
  setSelectedGroup: (g: Group | null) => void;
  clearMessages: () => void;
  clearGroupInputs?: () => void;
}

export function useRoomSync({
  user,
  users,
  groups,
  setRoomId,
  setRoomLabel,
  setSelectedGroup,
  clearMessages,
  clearGroupInputs = () => {},
}: UseRoomSyncArgs) {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    const groupMatch = location.pathname.match(/^\/messages\/group\/([^/]+)$/);
    if (groupMatch) {
      const gid = decodeURIComponent(groupMatch[1]);
      const group = groups.find((g) => g.id === gid);
      if (group) {
        setSelectedGroup(group);
        setRoomId(group.roomId);
        setRoomLabel(group.name);
      }
      return;
    }

    const dmMatch = location.pathname.match(/^\/messages\/([^/]+)$/);
    if (dmMatch) {
      const targetId = decodeURIComponent(dmMatch[1]);
      const target = users.find((u) => u.id === targetId);
      if (target) {
        setSelectedGroup(null);
        setRoomId(dmRoomId(user.id, target.id));
        setRoomLabel(target.username);
      }
      return;
    }

    if (location.pathname === '/messages') {
      setRoomId('');
      setRoomLabel('');
      setSelectedGroup(null);
      clearMessages();
    }
  }, [location.pathname, users, groups, user, clearMessages, setRoomId, setRoomLabel, setSelectedGroup]);

  const openDm = useCallback(
    (otherUser: ChatUser) => {
      if (!user) return;
      setSelectedGroup(null);
      setRoomId(dmRoomId(user.id, otherUser.id));
      setRoomLabel(otherUser.username);
      clearMessages();
      navigate(`/messages/${otherUser.id}`);
    },
    [user, setRoomId, setRoomLabel, setSelectedGroup, clearMessages, navigate]
  );

  const openGroup = useCallback(
    (group: Group) => {
      setSelectedGroup(group);
      setRoomId(group.roomId);
      setRoomLabel(group.name);
      clearMessages();
      navigate(`/messages/group/${group.id}`);
    },
    [setRoomId, setRoomLabel, setSelectedGroup, clearMessages, navigate]
  );

  const leaveChat = useCallback(() => {
    setRoomId('');
    setRoomLabel('');
    setSelectedGroup(null);
    clearMessages();
    clearGroupInputs();
    navigate(-1);
  }, [setRoomId, setRoomLabel, setSelectedGroup, clearMessages, clearGroupInputs, navigate]);

  return { openDm, openGroup, leaveChat };
}
