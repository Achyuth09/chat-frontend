import Avatar from './Avatar';
import type { AppNotification, ChatUser, FriendRequest } from '../types';

function activityText(item: AppNotification): string {
  const actor = item.actor?.username || 'Someone';
  if (item.type === 'friend_request_received') return `${actor} sent you a friend request`;
  if (item.type === 'friend_request_accepted') return `${actor} accepted your request`;
  if (item.type === 'post_liked') return `${actor} liked your post`;
  if (item.type === 'post_commented') return `${actor} commented on your post`;
  return `${actor} sent an update`;
}

interface GlobalTopToolsProps {
  globalSearchOpen: boolean;
  setGlobalSearchOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  globalActivityOpen: boolean;
  setGlobalActivityOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  globalSearch: string;
  setGlobalSearch: (value: string) => void;
  globalSearching: boolean;
  globalSearchResults: ChatUser[];
  globalSearchError: string;
  globalSendingTo: string;
  sendGlobalFriendRequest: (to: string) => Promise<void>;
  users: ChatUser[];
  globalRequestedIds: Record<string, boolean>;
  notificationsUnread: number;
  globalNotifications: AppNotification[];
  globalRequests: FriendRequest[];
  acceptGlobalRequest: (id: string) => Promise<void>;
  rejectGlobalRequest: (id: string) => Promise<void>;
}

export default function GlobalTopTools({
  globalSearchOpen,
  setGlobalSearchOpen,
  globalActivityOpen,
  setGlobalActivityOpen,
  globalSearch,
  setGlobalSearch,
  globalSearching,
  globalSearchResults,
  globalSearchError,
  globalSendingTo,
  sendGlobalFriendRequest,
  users,
  globalRequestedIds,
  notificationsUnread,
  globalNotifications,
  globalRequests,
  acceptGlobalRequest,
  rejectGlobalRequest,
}: GlobalTopToolsProps) {
  return (
    <div className="global-top-tools">
      <div className="inbox-top-actions">
        <button
          type="button"
          className="icon-btn"
          onClick={() => {
            setGlobalSearchOpen((prev) => !prev);
            setGlobalActivityOpen(false);
          }}
          aria-label="Toggle user search"
          aria-pressed={globalSearchOpen}
          title="Search users"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M10.5 4a6.5 6.5 0 0 1 5.17 10.45l4.44 4.44-1.41 1.41-4.44-4.44A6.5 6.5 0 1 1 10.5 4Zm0 2a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9Z"
              fill="currentColor"
            />
          </svg>
          <span className="sr-only">Search</span>
        </button>
        <button
          type="button"
          className="icon-btn"
          onClick={() => {
            setGlobalActivityOpen((prev) => !prev);
            setGlobalSearchOpen(false);
          }}
          aria-label="Toggle activity"
          aria-pressed={globalActivityOpen}
          title="Activity"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M12 3a6 6 0 0 1 6 6v2.76l1.45 2.9c.33.66-.15 1.44-.89 1.44H5.44c-.74 0-1.22-.78-.89-1.44L6 11.76V9a6 6 0 0 1 6-6Zm2 15a2 2 0 0 1-4 0h4Z"
              fill="currentColor"
            />
          </svg>
          <span className="sr-only">Activity</span>
          {(notificationsUnread > 0 || globalRequests.length > 0) && (
            <span className="icon-btn-badge">{notificationsUnread + globalRequests.length}</span>
          )}
        </button>
      </div>
      {globalSearchOpen && (
        <section className="home-card global-popover">
          <div className="user-search-head">
            <h2>Search users</h2>
            <small>Send a friend request</small>
          </div>
          <div className="user-search-input-wrap">
            <span className="user-search-icon" aria-hidden>
              #
            </span>
            <input
              type="text"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              placeholder="Type username..."
              className="user-search-input"
            />
            {globalSearch && (
              <button type="button" className="user-search-clear" onClick={() => setGlobalSearch('')}>
                Clear
              </button>
            )}
          </div>
          {globalSearch.trim().length < 1 ? (
            <p className="users-empty">Type to search</p>
          ) : globalSearching ? (
            <p className="users-empty">Searching...</p>
          ) : (
            <ul className="search-results-list">
              {globalSearchResults.length === 0 && <li className="users-empty">No matching users</li>}
              {globalSearchResults.map((u) => {
                const isFriend = users.some((friend) => friend.id === u.id);
                const isRequested = Boolean(globalRequestedIds[u.id]);
                const isSending = globalSendingTo === u.id;
                const disabled = isFriend || isRequested || isSending;
                const label = isFriend ? 'Friends' : isRequested ? 'Requested' : isSending ? 'Sending...' : 'Add';
                return (
                  <li key={u.id} className="search-result-row">
                    <span className="request-user">
                      <Avatar label={u.username} src={u.avatarUrl} />
                      <span className="list-item-main">
                        <strong>{u.username}</strong>
                        <small>@{u.username}</small>
                      </span>
                    </span>
                    <button
                      type="button"
                      className={`search-add-btn${isFriend || isRequested ? ' sent' : ''}`}
                      onClick={() => sendGlobalFriendRequest(u.id)}
                      disabled={disabled}
                    >
                      {label}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {globalSearchError && <p className="home-error">{globalSearchError}</p>}
        </section>
      )}
      {globalActivityOpen && (
        <section className="home-card global-popover">
          <div className="user-search-head">
            <h2>Activity</h2>
            <small>{notificationsUnread} unread notifications</small>
          </div>
          <h3 className="global-popover-title">Friend Requests</h3>
          <ul className="search-results-list">
            {globalRequests.length === 0 && <li className="users-empty">No pending requests</li>}
            {globalRequests.slice(0, 4).map((r) => (
              <li key={r.id} className="search-result-row">
                <span className="request-user">
                  <Avatar label={r.from.username} src={r.from.avatarUrl} />
                  <span className="list-item-main">
                    <strong>{r.from.username}</strong>
                    <small>Requested you</small>
                  </span>
                </span>
                <span className="request-actions">
                  <button type="button" onClick={() => acceptGlobalRequest(r.id)}>
                    Accept
                  </button>
                  <button type="button" className="danger-btn" onClick={() => rejectGlobalRequest(r.id)}>
                    Reject
                  </button>
                </span>
              </li>
            ))}
          </ul>
          <h3 className="global-popover-title">Notifications</h3>
          <ul className="search-results-list">
            {globalNotifications.length === 0 && <li className="users-empty">No recent notifications</li>}
            {globalNotifications.map((item) => (
              <li key={item.id} className={`search-result-row${item.read ? '' : ' unread'}`}>
                <span className="request-user">
                  <Avatar label={item.actor?.username || 'U'} src={item.actor?.avatarUrl} />
                  <span className="list-item-main">
                    <strong>{activityText(item)}</strong>
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
