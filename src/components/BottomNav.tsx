import { NavLink } from 'react-router-dom';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `bottom-nav-link${isActive ? ' active' : ''}`;

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      <NavLink to="/" className={linkClass} end>
        Home
      </NavLink>
      <NavLink to="/feed" className={linkClass}>
        Feed
      </NavLink>
      <NavLink to="/messages" className={linkClass}>
        Messages
      </NavLink>
      <NavLink to="/requests" className={linkClass}>
        Requests
      </NavLink>
      <NavLink to="/profile" className={linkClass}>
        Profile
      </NavLink>
    </nav>
  );
}
