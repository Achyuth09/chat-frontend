import { useState } from 'react';
import type { FormEvent } from 'react';
import type { MediaAttachment } from '../../types';

interface CreatePostFormProps {
  onUploadMedia: (file: File) => Promise<MediaAttachment | null>;
  onCreatePost: (args: { caption: string; media: MediaAttachment[] }) => Promise<void>;
}

export default function CreatePostForm({ onUploadMedia, onCreatePost }: CreatePostFormProps) {
  const [caption, setCaption] = useState('');
  const [media, setMedia] = useState<MediaAttachment[]>([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function onPickFile(file: File | null) {
    if (!file) return;
    const uploaded = await onUploadMedia(file);
    if (!uploaded) {
      setError('Failed to upload media');
      return;
    }
    setMedia((prev) => [uploaded, ...prev]);
    setError('');
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!caption.trim() && media.length === 0) {
      setError('Add a caption or upload media.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await onCreatePost({ caption: caption.trim(), media });
      setCaption('');
      setMedia([]);
    } catch {
      setError('Failed to create post');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="home-card">
      <h2>Create Post</h2>
      <form className="feed-create-form" onSubmit={handleSubmit}>
        <textarea
          placeholder="Write a caption..."
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          rows={3}
        />
        <label className="file-btn">
          Upload image/video
          <input
            type="file"
            accept="image/*,video/*"
            onChange={(e) => onPickFile(e.target.files?.[0] || null)}
          />
        </label>
        {media.length > 0 && (
          <div className="feed-preview-list">
            {media.map((item) =>
              item.type === 'video' ? (
                <video key={item.url} src={item.url} controls />
              ) : (
                <img key={item.url} src={item.url} alt="preview" />
              )
            )}
          </div>
        )}
        {error && <p className="home-error">{error}</p>}
        <button type="submit" disabled={submitting}>
          {submitting ? 'Posting...' : 'Post'}
        </button>
      </form>
    </section>
  );
}
