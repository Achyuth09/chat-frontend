import { useEffect, useState } from 'react';
import Avatar from '../components/Avatar';
import PostCard from '../components/feed/PostCard';
import { API } from '../lib/config';
import type { ChatUser, FeedPost } from '../types';

interface ProfilePageProps {
  user: ChatUser;
  onLogout: () => void;
  makeHeaders: (extra?: Record<string, string>) => Record<string, string>;
}

export default function ProfilePage({ user, onLogout, makeHeaders }: ProfilePageProps) {
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || '');
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    setAvatarUrl(user.avatarUrl || '');
  }, [user.avatarUrl]);

  useEffect(() => {
    fetch(`${API}/posts/me`, { headers: makeHeaders() })
      .then((res) => res.json())
      .then((data) => setPosts(Array.isArray(data.items) ? (data.items as FeedPost[]) : []))
      .catch(() => setPosts([]));
  }, [makeHeaders]);

  async function uploadAvatar(file: File | null) {
    if (!file) return;
    setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`${API}/users/me/avatar`, {
        method: 'POST',
        headers: makeHeaders(),
        body: fd,
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        return;
      }
      setAvatarUrl(data.avatarUrl || '');
    } catch {
      setError('Failed to upload avatar');
    }
  }

  async function toggleLike(postId: string) {
    try {
      const res = await fetch(`${API}/posts/${postId}/like`, {
        method: 'POST',
        headers: makeHeaders(),
      });
      const data = await res.json();
      if (data.error) return null;
      return { likesCount: Number(data.likesCount || 0), likedByMe: Boolean(data.likedByMe) };
    } catch {
      return null;
    }
  }

  async function addComment(postId: string, text: string) {
    const res = await fetch(`${API}/posts/${postId}/comments`, {
      method: 'POST',
      headers: makeHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ text }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    setPosts((prev) =>
      prev.map((p) =>
        p.id !== postId
          ? p
          : {
              ...p,
              commentsCount: data.commentsCount || p.commentsCount + 1,
              comments: [...p.comments, data.comment],
            }
      )
    );
  }

  return (
    <div className="app home-view">
      <div className="home-feed home-feed-scroll profile-feed">
        <section className="home-card profile-hero">
          <div className="profile-main">
            <span className="profile-avatar-wrap">
              <Avatar label={user.username} src={avatarUrl} />
            </span>
            <div className="profile-head-text">
              <h2>{user.username}</h2>
              <p>@{user.username.toLowerCase()}</p>
            </div>
          </div>
          <div className="profile-meta">
            <div className="profile-chip">
              <strong>{posts.length}</strong>
              <span>Posts</span>
            </div>
            <div className="profile-chip">
              <strong>Active</strong>
              <span>Status</span>
            </div>
          </div>
          <div className="profile-actions">
            <label className="file-btn profile-upload-btn">
              Change Photo
              <input
                type="file"
                accept="image/*"
                onChange={(e) => uploadAvatar(e.target.files?.[0] || null)}
              />
            </label>
            <button type="button" className="logout-btn profile-logout" onClick={onLogout}>
              Log out
            </button>
          </div>
          {error && <p className="home-error">{error}</p>}
        </section>
        <section className="home-card profile-posts-head">
          <h2>My Posts</h2>
          <small>Only you can manage and review your posts here.</small>
          {posts.length === 0 && <p className="users-empty">No posts yet.</p>}
        </section>
        {posts.map((post) => (
          <PostCard key={post.id} post={post} onToggleLike={toggleLike} onAddComment={addComment} />
        ))}
      </div>
    </div>
  );
}
