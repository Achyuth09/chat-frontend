import type { FormEvent, MutableRefObject } from 'react';
import Avatar from '../components/Avatar';
import type { ChatMessage, ChatUser, Group } from '../types';

interface MessagesPageProps {
  user: ChatUser;
  roomLabel: string;
  roomId: string;
  selectedGroup: Group | null;
  isGroupAdmin: boolean;
  memberUsername: string;
  setMemberUsername: (value: string) => void;
  onAddMember: (e: FormEvent<HTMLFormElement>) => void;
  onRemoveMember: (memberId: string) => void;
  messages: ChatMessage[];
  input: string;
  setInput: (value: string) => void;
  onSend: (e: FormEvent<HTMLFormElement>) => void;
  onSendMedia: (file: File) => Promise<void>;
  sendingMedia: boolean;
  onLeaveChat: () => void;
  onStartCall: () => void;
  messagesEndRef: MutableRefObject<HTMLLIElement | null>;
}

export default function MessagesPage({
  user,
  roomLabel,
  roomId,
  selectedGroup,
  isGroupAdmin,
  memberUsername,
  setMemberUsername,
  onAddMember,
  onRemoveMember,
  messages,
  input,
  setInput,
  onSend,
  onSendMedia,
  sendingMedia,
  onLeaveChat,
  onStartCall,
  messagesEndRef,
}: MessagesPageProps) {
  if (!roomLabel) {
    return (
      <div className="app home-view">
        <div className="home-feed">
          <section className="home-card">
            <h2>No active conversation</h2>
            <p className="users-empty">Open a group or DM from Home.</p>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="app chat-view">
      <header className="chat-header">
        <button type="button" className="back-btn" onClick={onLeaveChat} aria-label="Back">
          ←
        </button>
        <Avatar label={roomLabel} />
        <span className="room-name">{roomLabel}</span>
        <span className="you">{user.username}</span>
        {roomId && (
          <button type="button" className="call-btn" onClick={onStartCall}>
            Start Call
          </button>
        )}
      </header>

      {selectedGroup && (
        <section className="group-panel">
          <div className="member-tags">
            {selectedGroup.members?.map((m) => (
              <span key={m.id} className="member-tag">
                {m.username}
                {isGroupAdmin && m.id !== user.id && (
                  <button type="button" onClick={() => onRemoveMember(m.id)}>
                    x
                  </button>
                )}
              </span>
            ))}
          </div>
          {isGroupAdmin && (
            <form onSubmit={onAddMember} className="inline-form">
              <input
                type="text"
                value={memberUsername}
                onChange={(e) => setMemberUsername(e.target.value)}
                placeholder="Add member by username"
              />
              <button type="submit">Add</button>
            </form>
          )}
        </section>
      )}

      <ul className="message-list">
        {messages.length === 0 && <li className="empty-hint">No messages yet. Say hi!</li>}
        {messages.map((m) => (
          <li key={m._id} className={m.sender === user.username ? 'msg you' : 'msg other'}>
            <span className="sender">{m.sender}</span>
            <span className="text">{m.text}</span>
            {m.attachments?.map((a) =>
              a.type === 'video' ? (
                <video key={a.url} src={a.url} controls className="message-media" />
              ) : a.type === 'image' ? (
                <img key={a.url} src={a.url} alt={a.name || 'attachment'} className="message-media" />
              ) : (
                <a key={a.url} href={a.url} target="_blank" rel="noreferrer">
                  {a.originalName || a.name || 'Open attachment'}
                </a>
              )
            )}
            {m.createdAt && <span className="time">{new Date(m.createdAt).toLocaleTimeString()}</span>}
          </li>
        ))}
        <li ref={messagesEndRef} aria-hidden="true" />
      </ul>
      <form onSubmit={onSend} className="input-form">
        <input
          type="text"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          autoComplete="off"
        />
        <button type="submit">Send</button>
        <label className="file-btn compact">
          {sendingMedia ? 'Uploading...' : 'Attach'}
          <input
            type="file"
            accept="image/*,video/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onSendMedia(file);
              e.currentTarget.value = '';
            }}
          />
        </label>
      </form>
    </div>
  );
}
