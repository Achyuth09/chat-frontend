import { useCallback, useEffect, useState } from 'react';
import type { Socket } from 'socket.io-client';
import { API } from '../lib/config';
import type { AppNotification, FriendRequest, SentFriendRequest } from '../types';

interface UseGlobalActivityArgs {
  socket: Socket | null;
  token: string | null;
  user: { id: string } | null;
  makeHeaders: (extra?: Record<string, string>) => Record<string, string>;
}

export function useGlobalActivity({ socket, token, user, makeHeaders }: UseGlobalActivityArgs) {
  const [notificationsUnread, setNotificationsUnread] = useState(0);
  const [globalNotifications, setGlobalNotifications] = useState<AppNotification[]>([]);
  const [globalRequests, setGlobalRequests] = useState<FriendRequest[]>([]);
  const [globalRequestedIds, setGlobalRequestedIds] = useState<Record<string, boolean>>({});

  const loadActivitySummary = useCallback(async () => {
    if (!token || !user) return;
    try {
      const [notificationsRes, requestsRes, sentRequestsRes] = await Promise.all([
        fetch(`${API}/notifications`, { headers: makeHeaders() }),
        fetch(`${API}/friend-requests`, { headers: makeHeaders() }),
        fetch(`${API}/friend-requests/sent`, { headers: makeHeaders() }),
      ]);
      const [notificationsData, requestsData, sentRequestsData] = await Promise.all([
        notificationsRes.json(),
        requestsRes.json(),
        sentRequestsRes.json(),
      ]);
      const items = Array.isArray(notificationsData?.items)
        ? (notificationsData.items as AppNotification[])
        : [];
      setGlobalNotifications(items.slice(0, 6));
      setNotificationsUnread(Number(notificationsData?.unreadCount || 0));
      setGlobalRequests(Array.isArray(requestsData) ? (requestsData as FriendRequest[]) : []);
      const sent = Array.isArray(sentRequestsData) ? (sentRequestsData as SentFriendRequest[]) : [];
      setGlobalRequestedIds(
        sent.reduce<Record<string, boolean>>((acc, item) => {
          if (item?.to?.id) acc[item.to.id] = true;
          return acc;
        }, {})
      );
    } catch {
      // ignore
    }
  }, [token, user, makeHeaders]);

  const fetchUnread = useCallback(async () => {
    if (!token || !user) return;
    try {
      const res = await fetch(`${API}/notifications`, { headers: makeHeaders() });
      const data = await res.json();
      setNotificationsUnread(Number(data?.unreadCount || 0));
    } catch {
      // ignore
    }
  }, [token, user, makeHeaders]);

  useEffect(() => {
    if (!token || !user) {
      setNotificationsUnread(0);
      return;
    }
    loadActivitySummary();
  }, [token, user?.id, loadActivitySummary]);

  useEffect(() => {
    if (!socket || !user) return;

    const onActivityUpdate = () => {
      loadActivitySummary();
      fetchUnread();
    };

    socket.on('activity_update', onActivityUpdate);
    return () => {
      socket.off('activity_update', onActivityUpdate);
    };
  }, [socket, loadActivitySummary, fetchUnread]);

  return {
    notificationsUnread,
    setNotificationsUnread,
    globalNotifications,
    globalRequests,
    globalRequestedIds,
    setGlobalRequestedIds,
    setGlobalRequests,
  };
}
