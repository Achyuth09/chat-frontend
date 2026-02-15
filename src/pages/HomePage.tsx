import type { FormEvent } from 'react';
import Avatar from '../components/Avatar';
import type { ChatUser, Group } from '../types';
import { useEffect, useState } from 'react';
import { API } from '../lib/config';
import type { FeedPost } from '../types';
import PostCard from '../components/feed/PostCard';

interface HomePageProps {
  makeHeaders: (extra?: Record<string, string>) => Record<string, string>;
  user: ChatUser;
}

export default function HomePage({
  makeHeaders,
  user
}: HomePageProps) {

  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [error, setError] = useState('');

  async function fetchFeed() {
    setError('');
    try {
      const res = await fetch(`${API}/posts`, { headers: makeHeaders() });
      const data = await res.json();
      setPosts(Array.isArray(data.items) ? (data.items as FeedPost[]) : []);
    } catch {
      setError('Failed to load feed');
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
  useEffect(() => {
    fetchFeed();
  }, []);
  return (
    <div className="app home-view">
      <header className="home-header">
        <div className="header-user">
          <Avatar label={user.username} />
          <span>{user.username}</span>
        </div>
      </header>

      {posts.map((post) => (
          <PostCard key={post.id} post={post} onToggleLike={toggleLike} onAddComment={addComment} />
        ))}

      {error && <p className="home-error">{error}</p>}
    </div>
  );
}
