import { useCallback, useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { io, type Socket } from 'socket.io-client';
import Avatar from './components/Avatar';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import MessagesPage from './pages/MessagesPage';
import RequestsPage from './pages/RequestsPage';
import ProfilePage from './pages/ProfilePage';
import FeedPage from './pages/FeedPage';
import CallPage from './pages/CallPage';
import MessagesInboxPage from './pages/MessagesInboxPage';
import NotificationsPage from './pages/NotificationsPage';
import BottomNav from './components/BottomNav';
import type { AppNotification, ChatUser, FriendRequest, Group } from './types';
import { useAuth } from './hooks/useAuth';
import { useGroups } from './hooks/useGroups';
import { useMessages } from './hooks/useMessages';
import { API, SOCKET_URL } from './lib/config';

function dmRoomId(myId: string, otherId: string): string {
  const [a, b] = [myId, otherId].sort();
  return `dm:${a}:${b}`;
}

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [roomId, setRoomId] = useState('');
  const [roomLabel, setRoomLabel] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [incomingCall, setIncomingCall] = useState<{
    roomId: string;
    from?: { id?: string; username?: string };
  } | null>(null);
  const [notificationsUnread, setNotificationsUnread] = useState(0);
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
  const [globalActivityOpen, setGlobalActivityOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [globalSearching, setGlobalSearching] = useState(false);
  const [globalSearchResults, setGlobalSearchResults] = useState<ChatUser[]>([]);
  const [globalSearchError, setGlobalSearchError] = useState('');
  const [globalSendingTo, setGlobalSendingTo] = useState('');
  const [globalRequestedIds, setGlobalRequestedIds] = useState<Record<string, boolean>>({});
  const [globalNotifications, setGlobalNotifications] = useState<AppNotification[]>([]);
  const [globalRequests, setGlobalRequests] = useState<FriendRequest[]>([]);
  const callNotifySocketRef = useRef<Socket | null>(null);
  const ringIntervalRef = useRef<number | null>(null);
  const locationPathRef = useRef(location.pathname);

  const inMessages = location.pathname.startsWith('/messages');
  const inActiveChatRoom =
    /^\/messages\/[^/]+$/.test(location.pathname) || /^\/messages\/group\/[^/]+$/.test(location.pathname);
  const showGlobalTopTools = !location.pathname.startsWith('/call/') && !inActiveChatRoom;
  useEffect(() => {
    locationPathRef.current = location.pathname;
  }, [location.pathname]);

  const { user, token, authMode, setAuthMode, authError, setAuthError, status, handleAuth, logout } =
    useAuth();
  const makeHeaders = useCallback(
    (extra: Record<string, string> = {}) => {
      if (!token) return { ...extra };
      return { ...extra, Authorization: `Bearer ${token}` };
    },
    [token]
  );
  const {
    users,
    groups,
    homeError,
    newGroupName,
    setNewGroupName,
    memberUsername,
    setMemberUsername,
    handleCreateGroup,
    handleAddMember,
    removeMember,
    clearGroupInputs,
  } = useGroups({ token, user, makeHeaders });
  const {
    messages,
    input,
    setInput,
    handleSend,
    messagesEndRef,
    clearMessages,
    sendMediaMessage,
    sendingMedia,
  } = useMessages({
    token,
    user,
    inMessages,
    roomId,
    makeHeaders,
  });

  const isGroupAdmin = selectedGroup ? selectedGroup.admins?.includes(user?.id || '') : false;

  function openDm(otherUser: ChatUser) {
    if (!user) return;
    setSelectedGroup(null);
    setRoomId(dmRoomId(user.id, otherUser.id));
    setRoomLabel(otherUser.username);
    clearMessages();
    navigate(`/messages/${otherUser.id}`);
  }

  function openGroup(group: Group) {
    setSelectedGroup(group);
    setRoomId(group.roomId);
    setRoomLabel(group.name);
    clearMessages();
    navigate(`/messages/group/${group.id}`);
  }

  // Keep room state aligned with URL for direct links/reloads.
  useEffect(() => {
    if (!user) return;
    const groupMatch = location.pathname.match(/^\/messages\/group\/([^/]+)$/);
    if (groupMatch) {
      const gid = decodeURIComponent(groupMatch[1]);
      const group = groups.find((g) => g.id === gid);
      if (group) {
        setSelectedGroup(group);
        setRoomId(group.roomId);
        setRoomLabel(group.name);
      }
      return;
    }

    const dmMatch = location.pathname.match(/^\/messages\/([^/]+)$/);
    if (dmMatch) {
      const targetId = decodeURIComponent(dmMatch[1]);
      const target = users.find((u) => u.id === targetId);
      if (target) {
        setSelectedGroup(null);
        setRoomId(dmRoomId(user.id, target.id));
        setRoomLabel(target.username);
      }
      return;
    }

    if (location.pathname === '/messages') {
      setRoomId('');
      setRoomLabel('');
      setSelectedGroup(null);
      clearMessages();
    }
  }, [location.pathname, users, groups, user, clearMessages]);

  useEffect(() => {
    if (!token || !user) return;
    const socket = io(SOCKET_URL, { auth: { token } });
    callNotifySocketRef.current = socket;

    socket.on('incoming_call', (payload: { roomId?: string; from?: { id?: string; username?: string } }) => {
      if (!payload?.roomId) return;
      if (payload.from?.id && payload.from.id === user.id) return;
      if (locationPathRef.current.startsWith('/call/')) return;
      setIncomingCall({ roomId: payload.roomId, from: payload.from });
    });
    socket.on('call_accept', (payload: { roomId?: string }) => {
      if (!payload?.roomId) return;
      setIncomingCall((prev) => (prev?.roomId === payload.roomId ? null : prev));
    });
    socket.on('call_reject', (payload: { roomId?: string }) => {
      if (!payload?.roomId) return;
      setIncomingCall((prev) => (prev?.roomId === payload.roomId ? null : prev));
    });
    socket.on('call_ended', (payload: { roomId?: string }) => {
      if (!payload?.roomId) return;
      setIncomingCall((prev) => (prev?.roomId === payload.roomId ? null : prev));
    });

    return () => {
      socket.off('incoming_call');
      socket.off('call_accept');
      socket.off('call_reject');
      socket.off('call_ended');
      socket.disconnect();
      callNotifySocketRef.current = null;
    };
  }, [token, user]);

  useEffect(() => {
    function hasUserInteraction() {
      const ua = (navigator as Navigator & { userActivation?: { hasBeenActive?: boolean } }).userActivation;
      if (typeof ua?.hasBeenActive === 'boolean') return ua.hasBeenActive;
      return false;
    }

    function stopVibrationIfAllowed() {
      if (!('vibrate' in navigator) || !hasUserInteraction()) return;
      try {
        navigator.vibrate(0);
      } catch {
        // ignore browser intervention warnings
      }
    }

    function playRingTone() {
      if (!hasUserInteraction()) return;
      const AudioCtx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.38);
      window.setTimeout(() => {
        ctx.close().catch(() => {
          // ignore
        });
      }, 500);
    }

    if (!incomingCall || location.pathname.startsWith('/call/')) {
      if (ringIntervalRef.current) {
        window.clearInterval(ringIntervalRef.current);
        ringIntervalRef.current = null;
      }
      stopVibrationIfAllowed();
      return;
    }

    playRingTone();
    ringIntervalRef.current = window.setInterval(playRingTone, 1500);
    if ('vibrate' in navigator && hasUserInteraction()) {
      try {
        navigator.vibrate([200, 120, 200]);
      } catch {
        // ignore browser intervention warnings
      }
    }

    return () => {
      if (ringIntervalRef.current) {
        window.clearInterval(ringIntervalRef.current);
        ringIntervalRef.current = null;
      }
      stopVibrationIfAllowed();
    };
  }, [incomingCall, location.pathname]);

  useEffect(() => {
    setGlobalSearchOpen(false);
    setGlobalActivityOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!token || !user) {
      setNotificationsUnread(0);
      return;
    }

    let mounted = true;

    async function fetchUnread() {
      try {
        const res = await fetch(`${API}/notifications`, { headers: makeHeaders() });
        const data = await res.json();
        if (!mounted) return;
        setNotificationsUnread(Number(data?.unreadCount || 0));
      } catch {
        if (!mounted) return;
      }
    }

    fetchUnread();
    const id = window.setInterval(fetchUnread, 15000);
    return () => {
      mounted = false;
      window.clearInterval(id);
    };
  }, [token, user, makeHeaders]);

  useEffect(() => {
    if (!token || !user) return;
    let mounted = true;
    async function loadActivitySummary() {
      try {
        const [notificationsRes, requestsRes] = await Promise.all([
          fetch(`${API}/notifications`, { headers: makeHeaders() }),
          fetch(`${API}/friend-requests`, { headers: makeHeaders() }),
        ]);
        const [notificationsData, requestsData] = await Promise.all([
          notificationsRes.json(),
          requestsRes.json(),
        ]);
        if (!mounted) return;
        const items = Array.isArray(notificationsData?.items)
          ? (notificationsData.items as AppNotification[])
          : [];
        setGlobalNotifications(items.slice(0, 6));
        setNotificationsUnread(Number(notificationsData?.unreadCount || 0));
        setGlobalRequests(Array.isArray(requestsData) ? (requestsData as FriendRequest[]) : []);
      } catch {
        if (!mounted) return;
      }
    }
    loadActivitySummary();
    const id = window.setInterval(loadActivitySummary, 15000);
    return () => {
      mounted = false;
      window.clearInterval(id);
    };
  }, [token, user, makeHeaders]);

  useEffect(() => {
    const q = globalSearch.trim();
    if (!token || !user || q.length < 2) {
      setGlobalSearchResults([]);
      setGlobalSearching(false);
      setGlobalSearchError('');
      return;
    }
    const timeout = window.setTimeout(async () => {
      setGlobalSearching(true);
      setGlobalSearchError('');
      try {
        const res = await fetch(`${API}/users/search?q=${encodeURIComponent(q)}`, {
          headers: makeHeaders(),
        });
        const data = await res.json();
        setGlobalSearchResults(Array.isArray(data) ? (data as ChatUser[]) : []);
      } catch {
        setGlobalSearchResults([]);
        setGlobalSearchError('Could not search users right now');
      } finally {
        setGlobalSearching(false);
      }
    }, 260);
    return () => window.clearTimeout(timeout);
  }, [globalSearch, token, user, makeHeaders]);

  async function sendGlobalFriendRequest(to: string) {
    if (globalRequestedIds[to]) return;
    setGlobalSendingTo(to);
    setGlobalSearchError('');
    try {
      const res = await fetch(`${API}/friend-requests`, {
        method: 'POST',
        headers: makeHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ to }),
      });
      const data = await res.json();
      if (!res.ok || data?.error) {
        setGlobalSearchError(data?.error || 'Failed to send request');
        return;
      }
      setGlobalRequestedIds((prev) => ({ ...prev, [to]: true }));
    } catch {
      setGlobalSearchError('Failed to send request');
    } finally {
      setGlobalSendingTo('');
    }
  }

  async function acceptGlobalRequest(id: string) {
    try {
      const res = await fetch(`${API}/friend-requests/${id}/accept`, {
        method: 'POST',
        headers: makeHeaders(),
      });
      if (!res.ok) return;
      setGlobalRequests((prev) => prev.filter((r) => r.id !== id));
    } catch {
      // ignore
    }
  }

  async function rejectGlobalRequest(id: string) {
    try {
      const res = await fetch(`${API}/friend-requests/${id}`, {
        method: 'DELETE',
        headers: makeHeaders(),
      });
      if (!res.ok) return;
      setGlobalRequests((prev) => prev.filter((r) => r.id !== id));
    } catch {
      // ignore
    }
  }

  function activityText(item: AppNotification) {
    const actor = item.actor?.username || 'Someone';
    if (item.type === 'friend_request_received') return `${actor} sent you a friend request`;
    if (item.type === 'friend_request_accepted') return `${actor} accepted your request`;
    if (item.type === 'post_liked') return `${actor} liked your post`;
    if (item.type === 'post_commented') return `${actor} commented on your post`;
    return `${actor} sent an update`;
  }

  async function onAddMember(e: FormEvent<HTMLFormElement>) {
    const updated = await handleAddMember(e, selectedGroup);
    if (updated) setSelectedGroup(updated);
  }

  async function onRemoveMember(memberId: string) {
    const updated = await removeMember(memberId, selectedGroup);
    if (updated) setSelectedGroup(updated);
  }

  function leaveChat() {
    setRoomId('');
    setRoomLabel('');
    setSelectedGroup(null);
    clearMessages();
    clearGroupInputs();
    navigate('/');
  }

  async function handleLogout() {
    await logout(makeHeaders);
    setRoomId('');
    setRoomLabel('');
    setSelectedGroup(null);
    clearMessages();
    clearGroupInputs();
    setIncomingCall(null);
    navigate('/');
  }

  function acceptIncomingCall() {
    if (!incomingCall?.roomId) return;
    callNotifySocketRef.current?.emit('call_accept', { roomId: incomingCall.roomId });
    navigate(`/call/${encodeURIComponent(incomingCall.roomId)}`);
    setIncomingCall(null);
  }

  function rejectIncomingCall() {
    if (!incomingCall?.roomId) return;
    callNotifySocketRef.current?.emit('call_reject', { roomId: incomingCall.roomId });
    setIncomingCall(null);
  }

  function startCall(roomIdToCall: string) {
    if (!roomIdToCall) return;
    setIncomingCall(null);
    callNotifySocketRef.current?.emit('call_invite', { roomId: roomIdToCall });
    navigate(`/call/${encodeURIComponent(roomIdToCall)}`);
  }

  if (!user) {
    if (status === 'checking') {
      return (
        <div className="app">
          <div className="auth-card app-loader-card">
            <h1>Loading your session...</h1>
            <p className="status">Please wait</p>
          </div>
        </div>
      );
    }
    return (
      <AuthPage
        status={status}
        authMode={authMode}
        authError={authError}
        onSubmit={handleAuth}
        onToggleMode={() => {
          setAuthMode((m) => (m === 'signin' ? 'signup' : 'signin'));
          setAuthError('');
        }}
      />
    );
  }

  return (
    <div className="app-shell">
      <Routes>
        <Route
          path="/home"
          element={
            <HomePage
            user={user}
             makeHeaders={makeHeaders}
            />
          }
        />
        <Route
          path="/messages"
          element={<MessagesInboxPage users={users} groups={groups} />}
        />
        <Route
          path="/messages/:targetId"
          element={
            <MessagesPage
              user={user}
              roomLabel={roomLabel}
              roomId={roomId}
              selectedGroup={selectedGroup}
              isGroupAdmin={isGroupAdmin}
              memberUsername={memberUsername}
              setMemberUsername={(value) => setMemberUsername(value)}
              onAddMember={onAddMember}
              onRemoveMember={onRemoveMember}
              messages={messages}
              input={input}
              setInput={(value) => setInput(value)}
              onSend={handleSend}
              onSendMedia={sendMediaMessage}
              sendingMedia={sendingMedia}
              onLeaveChat={leaveChat}
              onStartCall={() => startCall(roomId)}
              messagesEndRef={messagesEndRef}
            />
          }
        />
        <Route
          path="/messages/group/:groupId"
          element={
            <MessagesPage
              user={user}
              roomLabel={roomLabel}
              roomId={roomId}
              selectedGroup={selectedGroup}
              isGroupAdmin={isGroupAdmin}
              memberUsername={memberUsername}
              setMemberUsername={(value) => setMemberUsername(value)}
              onAddMember={onAddMember}
              onRemoveMember={onRemoveMember}
              messages={messages}
              input={input}
              setInput={(value) => setInput(value)}
              onSend={handleSend}
              onSendMedia={sendMediaMessage}
              sendingMedia={sendingMedia}
              onLeaveChat={leaveChat}
              onStartCall={() => startCall(roomId)}
              messagesEndRef={messagesEndRef}
            />
          }
        />
        <Route path="/feed" element={<FeedPage makeHeaders={makeHeaders} />} />
        <Route
          path="/notifications"
          element={
            <NotificationsPage
              makeHeaders={makeHeaders}
              onUnreadCountChange={(count) => setNotificationsUnread(count)}
            />
          }
        />
        <Route path="/requests" element={<RequestsPage makeHeaders={makeHeaders} />} />
        <Route
          path="/profile"
          element={<ProfilePage user={user} onLogout={handleLogout} makeHeaders={makeHeaders} />}
        />
        <Route path="/call/:callRoomId" element={<CallPage token={token} user={user} users={users} />} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
      {incomingCall && (
        <div className="incoming-call-banner">
          <div>
            <strong>{incomingCall.from?.username || 'Someone'}</strong> is calling...
          </div>
          <div className="incoming-call-actions">
            <button type="button" onClick={acceptIncomingCall}>
              Accept
            </button>
            <button type="button" className="danger-btn" onClick={rejectIncomingCall}>
              Reject
            </button>
          </div>
        </div>
      )}
      {showGlobalTopTools && (
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
              {globalSearch.trim().length < 2 ? (
                <p className="users-empty">Enter at least 2 letters</p>
              ) : globalSearching ? (
                <p className="users-empty">Searching...</p>
              ) : (
                <ul className="search-results-list">
                  {globalSearchResults.length === 0 && <li className="users-empty">No matching users</li>}
                  {globalSearchResults.map((u) => (
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
                        className={`search-add-btn${globalRequestedIds[u.id] ? ' sent' : ''}`}
                        onClick={() => sendGlobalFriendRequest(u.id)}
                        disabled={globalSendingTo === u.id || globalRequestedIds[u.id]}
                      >
                        {globalRequestedIds[u.id] ? 'Requested' : globalSendingTo === u.id ? 'Sending...' : 'Add'}
                      </button>
                    </li>
                  ))}
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
      )}
      {!location.pathname.startsWith('/call/') && (
        <BottomNav />
      )}
    </div>
  );
}
