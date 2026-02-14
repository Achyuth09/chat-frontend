import { useEffect, useState } from 'react';
import { API } from '../lib/config';
import type { FeedPost, MediaAttachment } from '../types';
import CreatePostForm from '../components/feed/CreatePostForm';
import PostCard from '../components/feed/PostCard';

interface FeedPageProps {
  makeHeaders: (extra?: Record<string, string>) => Record<string, string>;
}

export default function FeedPage({ makeHeaders }: FeedPageProps) {
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

  useEffect(() => {
    fetchFeed();
  }, []);

  async function uploadMedia(file: File): Promise<MediaAttachment | null> {
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`${API}/upload`, {
        method: 'POST',
        headers: makeHeaders(),
        body: fd,
      });
      const data = await res.json();
      if (data.error || !data.url) return null;
      return data as MediaAttachment;
    } catch {
      return null;
    }
  }

  async function createPost(args: { caption: string; media: MediaAttachment[] }) {
    const res = await fetch(`${API}/posts`, {
      method: 'POST',
      headers: makeHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(args),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    setPosts((prev) => [data as FeedPost, ...prev]);
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
      <div className="home-feed">
        <CreatePostForm onUploadMedia={uploadMedia} onCreatePost={createPost} />
        {error && <p className="home-error">{error}</p>}
        {posts.map((post) => (
          <PostCard key={post.id} post={post} onToggleLike={toggleLike} onAddComment={addComment} />
        ))}
      </div>
    </div>
  );
}
