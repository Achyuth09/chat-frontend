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

  const previewComments = post.comments.slice(0, 2);
  const hasMoreComments = post.commentsCount > 2;

  return (
    <article className="post-card">
      <header className="post-head">
        <Avatar label={post.author.username} src={post.author.avatarUrl} />
        <span className="post-username">{post.author.username}</span>
      </header>
      <div className="post-media-wrap">
        {post.media.map((item) =>
          item.type === 'video' ? (
            <video key={item.url} src={item.url} controls className="post-media" playsInline />
          ) : (
            <img key={item.url} src={item.url} alt="" className="post-media" />
          )
        )}
      </div>
      <div className="post-body">
        <div className="post-actions">
          <button
            type="button"
            className={`post-action-btn${likedByMe ? ' liked' : ''}`}
            onClick={handleLike}
            aria-label={likedByMe ? 'Unlike' : 'Like'}
          >
            {likedByMe ? (
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            )}
          </button>
          <span className="post-action-icon" aria-hidden>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </svg>
          </span>
        </div>
        {likesCount > 0 && (
          <p className="post-likes">
            <strong>{likesCount} {likesCount === 1 ? 'like' : 'likes'}</strong>
          </p>
        )}
        {(post.caption || post.comments.length > 0) && (
          <div className="post-caption-block">
            {post.caption && (
              <p className="post-caption">
                <strong>{post.author.username}</strong>{' '}
                <span>{post.caption}</span>
              </p>
            )}
            {previewComments.map((c) => (
              <p key={c.id} className="post-comment-preview">
                <strong>{c.author.username}</strong> <span>{c.text}</span>
              </p>
            ))}
            {hasMoreComments && (
              <button type="button" className="post-view-comments">
                View all {post.commentsCount} comments
              </button>
            )}
          </div>
        )}
        <form className="post-add-comment" onSubmit={submitComment}>
          <input
            type="text"
            placeholder="Add a comment..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <button type="submit" className="post-comment-submit" disabled={!comment.trim()}>
            Post
          </button>
        </form>
      </div>
    </article>
  );
}
