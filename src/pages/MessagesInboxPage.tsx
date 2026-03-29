import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import Avatar from '../components/Avatar';
import Loader from '../components/Loader';
import type { ChatUser, Group } from '../types';

interface MessagesInboxPageProps {
  users: ChatUser[];
  groups: Group[];
  onlineUserIds: Set<string>;
  newGroupName: string;
  setNewGroupName: (value: string) => void;
  onCreateGroup: (e: FormEvent<HTMLFormElement>) => void;
  homeError?: string;
  loadingGroups?: boolean;
}

export default function MessagesInboxPage({
  users,
  groups,
  onlineUserIds,
  newGroupName,
  setNewGroupName,
  onCreateGroup,
  homeError,
  loadingGroups,
}: MessagesInboxPageProps) {
  return (
    <div className="app home-view">
      <header className="home-header page-header">
        <div className="header-user">
          <span>Messages</span>
        </div>
      </header>
      <div className="home-feed home-feed-scroll messages-home-feed">
        <section className="home-card">
          <h2>Groups</h2>
          <form onSubmit={onCreateGroup} className="inline-form create-group-form">
            <input
              type="text"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="Create a new group..."
              className="create-group-input"
            />
            <button type="submit">Create</button>
          </form>
          {homeError && <p className="home-error">{homeError}</p>}
          {loadingGroups ? (
            <Loader text="Loading groups..." />
          ) : (
            <ul className="users-list">
              {groups.length === 0 && <li className="users-empty">No groups yet</li>}
              {groups.map((g) => (
                <li key={g.id}>
                  <Link to={`/messages/group/${g.id}`} className="list-item-btn list-link">
                    <Avatar label={g.name} />
                    <span className="list-item-main">
                      <strong>{g.name}</strong>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="home-card">
          <h2>Messages</h2>
          <p className="users-empty">Only accepted friends appear here</p>
          {loadingGroups ? (
            <Loader text="Loading friends..." />
          ) : (
            <ul className="users-list">
              {users.length === 0 && <li className="users-empty">No friends yet</li>}
              {users.map((u) => (
                <li key={u.id}>
                  <Link to={`/messages/${u.id}`} className="list-item-btn list-link">
                    <span className="avatar-wrap">
                      <Avatar label={u.username} src={u.avatarUrl} />
                      {onlineUserIds.has(u.id) && <span className="online-dot" aria-label="Online" />}
                    </span>
                    <span className="list-item-main">
                      <strong>{u.username}</strong>
                      {onlineUserIds.has(u.id) && <small className="online-text">Online</small>}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
