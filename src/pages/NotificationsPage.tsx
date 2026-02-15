import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Avatar from '../components/Avatar';
import { API } from '../lib/config';
import type { AppNotification } from '../types';

interface NotificationsPageProps {
  makeHeaders: (extra?: Record<string, string>) => Record<string, string>;
  onUnreadCountChange?: (count: number) => void;
}

function timeAgo(value?: string) {
  if (!value) return '';
  const date = new Date(value).getTime();
  const now = Date.now();
  const diffMs = Math.max(now - date, 0);
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function messageFor(item: AppNotification) {
  const actor = item.actor?.username || 'Someone';
  if (item.type === 'friend_request_received') return `${actor} sent you a friend request`;
  if (item.type === 'friend_request_accepted') return `${actor} accepted your friend request`;
  if (item.type === 'post_liked') return `${actor} liked your post`;
  if (item.type === 'post_commented') {
    const text = (item.commentText || '').trim();
    return text ? `${actor} commented: "${text}"` : `${actor} commented on your post`;
  }
  return `${actor} sent a notification`;
}

export default function NotificationsPage({ makeHeaders, onUnreadCountChange }: NotificationsPageProps) {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState('');

  async function loadNotifications() {
    setError('');
    try {
      const res = await fetch(`${API}/notifications`, { headers: makeHeaders() });
      const data = await res.json();
      setItems(Array.isArray(data?.items) ? (data.items as AppNotification[]) : []);
      const nextUnread = Number(data?.unreadCount || 0);
      setUnreadCount(nextUnread);
      onUnreadCountChange?.(nextUnread);
    } catch {
      setError('Failed to load notifications');
    }
  }

  useEffect(() => {
    loadNotifications();
  }, []);

  async function markAllRead() {
    try {
      const res = await fetch(`${API}/notifications/read-all`, {
        method: 'POST',
        headers: makeHeaders(),
      });
      if (!res.ok) return;
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
      onUnreadCountChange?.(0);
    } catch {
      // ignore
    }
  }

  return (
    <div className="app home-view">
      <div className="home-feed">
        <section className="home-card">
          <div className="notifications-head">
            <h2>Notifications</h2>
            <div className="notifications-head-actions">
              <span>{unreadCount} unread</span>
              <button type="button" onClick={markAllRead} disabled={unreadCount === 0}>
                Mark all read
              </button>
            </div>
          </div>
          {items.length === 0 && <p className="users-empty">No notifications yet</p>}
          <ul className="notifications-list">
            {items.map((item) => (
              <li key={item.id} className={`notification-row${item.read ? '' : ' unread'}`}>
                <span className="request-user">
                  <Avatar label={item.actor?.username || 'U'} src={item.actor?.avatarUrl} />
                  <span className="notification-main">
                    <strong>{messageFor(item)}</strong>
                    <small>{timeAgo(item.createdAt)}</small>
                  </span>
                </span>
                {item.type === 'friend_request_received' && (
                  <Link to="/requests" className="list-link">
                    Open requests
                  </Link>
                )}
                {(item.type === 'post_liked' || item.type === 'post_commented') && (
                  <Link to="/feed" className="list-link">
                    Open feed
                  </Link>
                )}
              </li>
            ))}
          </ul>
          {error && <p className="home-error">{error}</p>}
        </section>
      </div>
    </div>
  );
}
