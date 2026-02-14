import { useState } from 'react';
import type { FormEvent } from 'react';
import Avatar from '../Avatar';
import type { FeedPost } from '../../types';

interface PostCardProps {
  post: FeedPost;
  onToggleLike: (postId: string) => Promise<{ likesCount: number; likedByMe: boolean } | null>;
  onAddComment: (postId: string, text: string) => Promise<void>;
}

export default function PostCard({ post, onToggleLike, onAddComment }: PostCardProps) {
  const [comment, setComment] = useState('');
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [likedByMe, setLikedByMe] = useState(post.likedByMe);

  async function handleLike() {
    const next = await onToggleLike(post.id);
    if (!next) return;
    setLikesCount(next.likesCount);
    setLikedByMe(next.likedByMe);
  }

  async function submitComment(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!comment.trim()) return;
    await onAddComment(post.id, comment.trim());
    setComment('');
  }

  return (
    <article className="home-card post-card">
      <header className="post-head">
        <Avatar label={post.author.username} />
        <div>
          <strong>{post.author.username}</strong>
          <small>{new Date(post.createdAt).toLocaleString()}</small>
        </div>
      </header>
      {post.caption && <p className="post-caption">{post.caption}</p>}
      {post.media.map((item) =>
        item.type === 'video' ? (
          <video key={item.url} src={item.url} controls className="post-media" />
        ) : (
          <img key={item.url} src={item.url} alt="post media" className="post-media" />
        )
      )}
      <div className="post-actions">
        <button type="button" onClick={handleLike}>
          {likedByMe ? 'Unlike' : 'Like'} ({likesCount})
        </button>
        <span>{post.commentsCount} comments</span>
      </div>
      <ul className="post-comments">
        {post.comments.map((c) => (
          <li key={c.id}>
            <strong>{c.author.username}</strong> {c.text}
          </li>
        ))}
      </ul>
      <form className="inline-form" onSubmit={submitComment}>
        <input
          type="text"
          placeholder="Add a comment..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
        <button type="submit">Send</button>
      </form>
    </article>
  );
}
