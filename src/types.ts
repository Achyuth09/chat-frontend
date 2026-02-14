export type AuthMode = 'signin' | 'signup';
export type HealthStatus = 'checking' | 'connected' | 'error';

export interface ChatUser {
  id: string;
  username: string;
  avatarUrl?: string;
}

export interface GroupMember {
  id: string;
  username: string;
}

export interface Group {
  id: string;
  name: string;
  roomId: string;
  admins: string[];
  members: GroupMember[];
}

export interface ChatMessage {
  _id: string;
  roomId: string;
  sender: string;
  text: string;
  attachments?: MediaAttachment[];
  createdAt?: string;
}

export interface MediaAttachment {
  url: string;
  publicId?: string;
  type: string;
  width?: number | null;
  height?: number | null;
  duration?: number | null;
  originalName?: string | null;
  name?: string | null;
}

export interface PostComment {
  id: string;
  text: string;
  createdAt: string;
  author: ChatUser;
}

export interface FeedPost {
  id: string;
  caption: string;
  media: MediaAttachment[];
  author: ChatUser;
  likesCount: number;
  likedByMe: boolean;
  commentsCount: number;
  comments: PostComment[];
  createdAt: string;
  updatedAt: string;
}
