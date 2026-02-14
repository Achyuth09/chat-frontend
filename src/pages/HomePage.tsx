import type { FormEvent } from 'react';
import Avatar from '../components/Avatar';
import type { ChatUser, Group } from '../types';

interface HomePageProps {
  user: ChatUser;
  groups: Group[];
  users: ChatUser[];
  homeError: string;
  newGroupName: string;
  setNewGroupName: (value: string) => void;
  onCreateGroup: (e: FormEvent<HTMLFormElement>) => void;
  onOpenGroup: (group: Group) => void;
  onOpenDm: (user: ChatUser) => void;
}

export default function HomePage({
  user,
  groups,
  users,
  homeError,
  newGroupName,
  setNewGroupName,
  onCreateGroup,
  onOpenGroup,
  onOpenDm,
}: HomePageProps) {
  return (
    <div className="app home-view">
      <header className="home-header">
        <div className="header-user">
          <Avatar label={user.username} />
          <span>{user.username}</span>
        </div>
      </header>

      <div className="home-feed">
        <section className="home-card">
          <h2>Create Group</h2>
          <form onSubmit={onCreateGroup} className="stack-form">
            <input
              type="text"
              placeholder="Group name"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
            />
            <button type="submit">Create</button>
          </form>
        </section>

        <section className="home-card">
          <h2>Groups</h2>
          <ul className="users-list">
            {groups.length === 0 && <li className="users-empty">No groups yet</li>}
            {groups.map((g) => (
              <li key={g.id}>
                <button type="button" onClick={() => onOpenGroup(g)} className="list-item-btn">
                  <Avatar label={g.name} />
                  <span className="list-item-main">
                    <strong>{g.name}</strong>
                    {g.admins?.includes(user.id) && <small>admin</small>}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="home-card">
          <h2>Direct Messages</h2>
          <ul className="users-list">
            {users.length === 0 && <li className="users-empty">No other users yet</li>}
            {users.map((u) => (
              <li key={u.id}>
                <button type="button" onClick={() => onOpenDm(u)} className="list-item-btn">
                  <Avatar label={u.username} />
                  <span className="list-item-main">
                    <strong>{u.username}</strong>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {homeError && <p className="home-error">{homeError}</p>}
    </div>
  );
}
