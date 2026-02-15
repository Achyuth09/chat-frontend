import { useEffect, useState } from 'react';
import { API } from '../lib/config';
import Avatar from '../components/Avatar';
import type { FriendRequest } from '../types';

interface RequestsPageProps {
  makeHeaders: (extra?: Record<string, string>) => Record<string, string>;
}

export default function RequestsPage({ makeHeaders }: RequestsPageProps) {
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [error, setError] = useState('');

  async function fetchRequests() {
    setError('');
    try {
      const res = await fetch(`${API}/friend-requests`, { headers: makeHeaders() });
      const data = await res.json();
      setRequests(Array.isArray(data) ? (data as FriendRequest[]) : []);
    } catch {
      setError('Failed to load friend requests');
    }
  }

  useEffect(() => {
    fetchRequests();
  }, []);

  async function acceptRequest(id: string) {
    try {
      const res = await fetch(`${API}/friend-requests/${id}/accept`, {
        method: 'POST',
        headers: makeHeaders(),
      });
      if (!res.ok) return;
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } catch {
      // ignore
    }
  }

  async function rejectRequest(id: string) {
    try {
      const res = await fetch(`${API}/friend-requests/${id}`, {
        method: 'DELETE',
        headers: makeHeaders(),
      });
      if (!res.ok) return;
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } catch {
      // ignore
    }
  }

  return (
    <div className="app home-view">
      <div className="home-feed">
        <section className="home-card">
          <h2>Requests</h2>
          {requests.length === 0 && <p className="users-empty">No pending requests</p>}
          <ul className="users-list">
            {requests.map((r) => (
              <li key={r.id} className="request-row">
                <span className="request-user">
                  <Avatar label={r.from.username} />
                  <strong>{r.from.username}</strong>
                </span>
                <span className="request-actions">
                  <button type="button" onClick={() => acceptRequest(r.id)}>
                    Accept
                  </button>
                  <button type="button" className="danger-btn" onClick={() => rejectRequest(r.id)}>
                    Reject
                  </button>
                </span>
              </li>
            ))}
          </ul>
          {error && <p className="home-error">{error}</p>}
        </section>
      </div>
    </div>
  );
}
