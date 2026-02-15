import { NavLink } from 'react-router-dom';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `bottom-nav-link${isActive ? ' active' : ''}`;

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      <NavLink to="/" className={linkClass} end>
        <span className="nav-icon-wrap" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path
              d="M12 3.5 3.5 10.8l1.3 1.5L6 11.2V20h5.5v-4.8h1V20H18v-8.8l1.2 1.1 1.3-1.5L12 3.5Z"
              fill="currentColor"
            />
          </svg>
        </span>
        <span className="sr-only">Home</span>
      </NavLink>
      <NavLink to="/feed" className={linkClass}>
        <span className="nav-icon-wrap" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path
              d="M5 4.5h14A1.5 1.5 0 0 1 20.5 6v12a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 18V6A1.5 1.5 0 0 1 5 4.5Zm2 3v2h2v-2H7Zm0 4v2h2v-2H7Zm4-4v2h6v-2h-6Zm0 4v2h6v-2h-6Z"
              fill="currentColor"
            />
          </svg>
        </span>
        <span className="sr-only">Feed</span>
      </NavLink>
      <NavLink to="/messages" className={linkClass}>
        <span className="nav-icon-wrap" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path
              d="M6 5h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H9l-4 3v-3H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Zm1.5 4.5h9v-1.5h-9v1.5Zm0 3h6v-1.5h-6v1.5Z"
              fill="currentColor"
            />
          </svg>
        </span>
        <span className="sr-only">Messages</span>
      </NavLink>
      <NavLink to="/profile" className={linkClass}>
        <span className="nav-icon-wrap" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path
              d="M12 12a4.2 4.2 0 1 0 0-8.4 4.2 4.2 0 0 0 0 8.4Zm0 2.3c-4.1 0-7.4 2.5-7.4 5.6V21h14.8v-1.1c0-3.1-3.3-5.6-7.4-5.6Z"
              fill="currentColor"
            />
          </svg>
        </span>
        <span className="sr-only">Profile</span>
      </NavLink>
    </nav>
  );
}
