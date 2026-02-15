import { useEffect, useState } from 'react';
import { API } from '../lib/config';
import type { FeedPost, MediaAttachment } from '../types';
import CreatePostForm from '../components/feed/CreatePostForm';
import PostCard from '../components/feed/PostCard';

interface FeedPageProps {
  makeHeaders: (extra?: Record<string, string>) => Record<string, string>;
}

export default function FeedPage({ makeHeaders }: FeedPageProps) {

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
  }


  return (
    <div className="app home-view">
      <div className="home-feed">
        <CreatePostForm onUploadMedia={uploadMedia} onCreatePost={createPost} />
      </div>
    </div>
  );
}
