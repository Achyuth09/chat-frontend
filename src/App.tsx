import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import MessagesPage from './pages/MessagesPage';
import RequestsPage from './pages/RequestsPage';
import ProfilePage from './pages/ProfilePage';
import UserProfilePage from './pages/UserProfilePage';
import FeedPage from './pages/FeedPage';
import CallPage from './pages/CallPage';
import MessagesInboxPage from './pages/MessagesInboxPage';
import NotificationsPage from './pages/NotificationsPage';
import BottomNav from './components/BottomNav';
import IncomingCallBanner from './components/IncomingCallBanner';
import GlobalTopTools from './components/GlobalTopTools';
import type { Group } from './types';
import { useAuth } from './hooks/useAuth';
import { useGroups } from './hooks/useGroups';
import { useMessages } from './hooks/useMessages';
import { useAppSocket } from './hooks/useAppSocket';
import { useIncomingCall } from './hooks/useIncomingCall';
import { useCallRingtone } from './hooks/useCallRingtone';
import { useRoomSync } from './hooks/useRoomSync';
import { useGlobalActivity } from './hooks/useGlobalActivity';
import { useGlobalSearch } from './hooks/useGlobalSearch';
import { useOnlineUsers } from './hooks/useOnlineUsers';
import { API } from './lib/config';

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [roomId, setRoomId] = useState('');
  const [roomLabel, setRoomLabel] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
  const [globalActivityOpen, setGlobalActivityOpen] = useState(false);

  const inMessages = location.pathname.startsWith('/messages');
  const inActiveChatRoom =
    /^\/messages\/[^/]+$/.test(location.pathname) || /^\/messages\/group\/[^/]+$/.test(location.pathname);
  const showGlobalTopTools = !location.pathname.startsWith('/call/') && !inActiveChatRoom;

  const { user, token, authMode, setAuthMode, authError, setAuthError, status, handleAuth, logout } = useAuth();

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
    newGroupName,
    setNewGroupName,
    handleCreateGroup,
    homeError,
    memberUsername,
    setMemberUsername,
    handleAddMember,
    removeMember,
    refreshHomeData,
    clearGroupInputs,
    loadingGroups,
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
    loadingMessages,
  } = useMessages({
    token,
    user,
    inMessages,
    roomId,
    makeHeaders,
  });

  const { socket } = useAppSocket({ token, user });

  const {
    incomingCall,
    setIncomingCall,
    acceptIncomingCall,
    rejectIncomingCall,
    startCall,
    clearIncomingCall,
  } = useIncomingCall({ socket, user });

  useCallRingtone({ incomingCall });

  const { leaveChat, openDm } = useRoomSync({
    user,
    users,
    groups,
    setRoomId,
    setRoomLabel,
    setSelectedGroup,
    clearMessages,
    clearGroupInputs,
  });

  const {
    notificationsUnread,
    setNotificationsUnread,
    globalNotifications,
    globalRequests,
    globalRequestedIds,
    setGlobalRequestedIds,
    setGlobalRequests,
    loadActivitySummary,
    markNotificationRead,
  } = useGlobalActivity({ socket, token, user, makeHeaders, refreshHomeData });

  const { onlineUserIds } = useOnlineUsers(socket);

  const {
    globalSearch,
    setGlobalSearch,
    globalSearching,
    globalSearchResults,
    globalSearchError,
    setGlobalSearchError,
    globalSendingTo,
    setGlobalSendingTo,
  } = useGlobalSearch({ token, user, makeHeaders });

  useEffect(() => {
    setGlobalSearchOpen(false);
    setGlobalActivityOpen(false);
  }, [location.pathname]);

  const isGroupAdmin = selectedGroup ? selectedGroup.admins?.includes(user?.id || '') : false;

  const sendGlobalFriendRequest = useCallback(
    async (to: string) => {
      if (globalRequestedIds[to] || users.some((u) => u.id === to)) return;
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
    },
    [globalRequestedIds, users, makeHeaders, setGlobalSearchError, setGlobalRequestedIds]
  );

  const acceptGlobalRequest = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`${API}/friend-requests/${id}/accept`, {
          method: 'POST',
          headers: makeHeaders(),
        });
        if (!res.ok) return;
        setGlobalRequests((prev) => prev.filter((r) => r.id !== id));
        await refreshHomeData();
      } catch {
        // ignore
      }
    },
    [makeHeaders, setGlobalRequests, refreshHomeData]
  );

  const rejectGlobalRequest = useCallback(
    async (id: string) => {
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
    },
    [makeHeaders, setGlobalRequests]
  );

  async function onAddMember(e: FormEvent<HTMLFormElement>) {
    const updated = await handleAddMember(e, selectedGroup);
    if (updated) setSelectedGroup(updated);
  }

  async function onRemoveMember(memberId: string) {
    const updated = await removeMember(memberId, selectedGroup);
    if (updated) setSelectedGroup(updated);
  }

  async function handleLogout() {
    await logout(makeHeaders);
    setRoomId('');
    setRoomLabel('');
    setSelectedGroup(null);
    clearMessages();
    clearGroupInputs();
    clearIncomingCall();
    navigate('/');
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

  const messagesPageProps = {
    user,
    roomLabel,
    roomId,
    selectedGroup,
    onlineUserIds,
    isGroupAdmin,
    memberUsername,
    setMemberUsername: (value: string) => setMemberUsername(value),
    onAddMember,
    onRemoveMember,
    messages,
    input,
    setInput: (value: string) => setInput(value),
    onSend: handleSend,
    onSendMedia: sendMediaMessage,
    sendingMedia,
    loadingMessages,
    onLeaveChat: leaveChat,
    onStartCall: () => startCall(roomId),
    messagesEndRef,
  };

  return (
    <div className="app-shell">
      <main className="app-main">
        <Routes>
        <Route path="/home" element={<HomePage user={user} makeHeaders={makeHeaders} />} />
        <Route
          path="/messages"
          element={
            <MessagesInboxPage
              users={users}
              groups={groups}
              onlineUserIds={onlineUserIds}
              newGroupName={newGroupName}
              setNewGroupName={setNewGroupName}
              onCreateGroup={handleCreateGroup}
              homeError={homeError}
              loadingGroups={loadingGroups}
            />
          }
        />
        <Route
          path="/messages/:targetId"
          element={<MessagesPage {...messagesPageProps} />}
        />
        <Route
          path="/messages/group/:groupId"
          element={<MessagesPage {...messagesPageProps} />}
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
        <Route path="/profile" element={<ProfilePage user={user} onLogout={handleLogout} makeHeaders={makeHeaders} />} />
        <Route
          path="/profile/:userId"
          element={
            <UserProfilePage
              currentUser={user}
              makeHeaders={makeHeaders}
              onOpenChat={(u) => openDm(u)}
            />
          }
        />
        <Route path="/call/:callRoomId" element={<CallPage token={token} user={user} users={users} />} />
        <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </main>

      {incomingCall && (
        <IncomingCallBanner
          incomingCall={incomingCall}
          onAccept={acceptIncomingCall}
          onReject={rejectIncomingCall}
        />
      )}

      {showGlobalTopTools && (
        <GlobalTopTools
          globalSearchOpen={globalSearchOpen}
          setGlobalSearchOpen={setGlobalSearchOpen}
          globalActivityOpen={globalActivityOpen}
          setGlobalActivityOpen={setGlobalActivityOpen}
          globalSearch={globalSearch}
          setGlobalSearch={setGlobalSearch}
          globalSearching={globalSearching}
          globalSearchResults={globalSearchResults}
          globalSearchError={globalSearchError}
          globalSendingTo={globalSendingTo}
          sendGlobalFriendRequest={sendGlobalFriendRequest}
          users={users}
          globalRequestedIds={globalRequestedIds}
          notificationsUnread={notificationsUnread}
          globalNotifications={globalNotifications}
          globalRequests={globalRequests}
          acceptGlobalRequest={acceptGlobalRequest}
          rejectGlobalRequest={rejectGlobalRequest}
          onMarkNotificationRead={markNotificationRead}
          onRefreshActivity={loadActivitySummary}
        />
      )}

      {!location.pathname.startsWith('/call/') && <BottomNav />}
    </div>
  );
}
