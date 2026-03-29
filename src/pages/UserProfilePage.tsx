import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Avatar from '../components/Avatar';
import PostCard from '../components/feed/PostCard';
import Loader from '../components/Loader';
import { API } from '../lib/config';
import type { ChatUser, FeedPost } from '../types';

interface UserProfilePageProps {
  currentUser: ChatUser;
  makeHeaders: (extra?: Record<string, string>) => Record<string, string>;
  onOpenChat: (user: ChatUser) => void;
}

export default function UserProfilePage({ currentUser, makeHeaders, onOpenChat }: UserProfilePageProps) {
  const { userId = '' } = useParams();
  const navigate = useNavigate();
  const [profileUser, setProfileUser] = useState<ChatUser | null>(null);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const isSelf = userId === currentUser.id;

  useEffect(() => {
    if (!userId || isSelf) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    Promise.all([
      fetch(`${API}/users/${userId}`, { headers: makeHeaders() }),
      fetch(`${API}/posts/user/${userId}`, { headers: makeHeaders() }),
    ])
      .then(async ([userRes, postsRes]) => {
        const userData = await userRes.json();
        const postsData = await postsRes.json();
        if (!userRes.ok) throw new Error(userData?.error || 'User not found');
        if (!postsRes.ok) throw new Error(postsData?.error || 'Could not load posts');
        setProfileUser(userData as ChatUser);
        setPosts(Array.isArray(postsData.items) ? (postsData.items as FeedPost[]) : []);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load profile');
        setProfileUser(null);
        setPosts([]);
      })
      .finally(() => setLoading(false));
  }, [userId, isSelf, makeHeaders]);

  useEffect(() => {
    if (isSelf) navigate('/profile', { replace: true });
  }, [isSelf, navigate]);

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

  if (isSelf || loading) {
    return (
      <div className="app home-view">
        <div className="home-feed home-feed-scroll profile-feed">
          <Loader text="Loading profile..." />
        </div>
      </div>
    );
  }

  if (error || !profileUser) {
    return (
      <div className="app home-view">
        <div className="home-feed home-feed-scroll profile-feed">
          <section className="profile-empty">
            <p className="home-error">{error || 'User not found'}</p>
            <button type="button" className="logout-btn profile-logout" onClick={() => navigate(-1)}>
              Go back
            </button>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="app home-view">
      <div className="home-feed home-feed-scroll profile-feed">
        <section className="profile-hero">
          <button type="button" className="back-btn profile-back" onClick={() => navigate(-1)} aria-label="Back">
            ←
          </button>
          <div className="profile-main">
            <span className="profile-avatar-wrap">
              <Avatar label={profileUser.username} src={profileUser.avatarUrl} size="lg" />
            </span>
            <div className="profile-head-text">
              <h2>{profileUser.username}</h2>
              <p className="profile-handle">@{profileUser.username.toLowerCase()}</p>
              <div className="profile-stats">
                <span><strong>{posts.length}</strong> posts</span>
              </div>
            </div>
          </div>
          <div className="profile-actions">
            <button
              type="button"
              className="file-btn profile-upload-btn"
              onClick={() => onOpenChat(profileUser)}
            >
              Message
            </button>
          </div>
        </section>
        {posts.length === 0 ? (
          <section className="profile-empty">
            <p className="users-empty">No posts yet.</p>
          </section>
        ) : (
          posts.map((post) => (
            <section key={post.id} className="post-card-container">
              <PostCard post={post} onToggleLike={toggleLike} onAddComment={addComment} />
            </section>
          ))
        )}
      </div>
    </div>
  );
}
