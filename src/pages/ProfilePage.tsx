import Avatar from '../components/Avatar';
import type { ChatUser } from '../types';

interface ProfilePageProps {
  user: ChatUser;
  onLogout: () => void;
}

export default function ProfilePage({ user, onLogout }: ProfilePageProps) {
  return (
    <div className="app home-view">
      <div className="home-feed">
        <section className="home-card profile-card">
          <Avatar label={user.username} />
          <h2>{user.username}</h2>
          <p className="users-empty">Profile settings can be added here.</p>
          <button type="button" className="logout-btn profile-logout" onClick={onLogout}>
            Log out
          </button>
        </section>
      </div>
    </div>
  );
}
