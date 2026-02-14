import { Link } from 'react-router-dom';
import Avatar from '../components/Avatar';
import type { ChatUser, Group } from '../types';

interface MessagesInboxPageProps {
  users: ChatUser[];
  groups: Group[];
}

export default function MessagesInboxPage({ users, groups }: MessagesInboxPageProps) {
  return (
    <div className="app home-view">
      <div className="home-feed">
        <section className="home-card">
          <h2>Groups</h2>
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
        </section>
        <section className="home-card">
          <h2>Direct Messages</h2>
          <ul className="users-list">
            {users.length === 0 && <li className="users-empty">No users found</li>}
            {users.map((u) => (
              <li key={u.id}>
                <Link to={`/messages/${u.id}`} className="list-item-btn list-link">
                  <Avatar label={u.username} />
                  <span className="list-item-main">
                    <strong>{u.username}</strong>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
