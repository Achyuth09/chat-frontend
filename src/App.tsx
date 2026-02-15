import { useCallback, useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { io, type Socket } from 'socket.io-client';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import MessagesPage from './pages/MessagesPage';
import RequestsPage from './pages/RequestsPage';
import ProfilePage from './pages/ProfilePage';
import FeedPage from './pages/FeedPage';
import CallPage from './pages/CallPage';
import MessagesInboxPage from './pages/MessagesInboxPage';
import BottomNav from './components/BottomNav';
import type { ChatUser, Group } from './types';
import { useAuth } from './hooks/useAuth';
import { useGroups } from './hooks/useGroups';
import { useMessages } from './hooks/useMessages';
import { SOCKET_URL } from './lib/config';

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
  const callNotifySocketRef = useRef<Socket | null>(null);
  const ringIntervalRef = useRef<number | null>(null);

  const inMessages = location.pathname.startsWith('/messages');
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
      if (location.pathname.startsWith('/call/')) return;
      setIncomingCall({ roomId: payload.roomId, from: payload.from });
    });
    socket.on('call_ended', (payload: { roomId?: string }) => {
      if (!payload?.roomId) return;
      setIncomingCall((prev) => (prev?.roomId === payload.roomId ? null : prev));
    });

    return () => {
      socket.off('incoming_call');
      socket.off('call_ended');
      socket.disconnect();
      callNotifySocketRef.current = null;
    };
  }, [token, user, location.pathname]);

  useEffect(() => {
    function playRingTone() {
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

    if (!incomingCall) {
      if (ringIntervalRef.current) {
        window.clearInterval(ringIntervalRef.current);
        ringIntervalRef.current = null;
      }
      if ('vibrate' in navigator) navigator.vibrate(0);
      return;
    }

    playRingTone();
    ringIntervalRef.current = window.setInterval(playRingTone, 1500);
    if ('vibrate' in navigator) navigator.vibrate([200, 120, 200]);

    return () => {
      if (ringIntervalRef.current) {
        window.clearInterval(ringIntervalRef.current);
        ringIntervalRef.current = null;
      }
      if ('vibrate' in navigator) navigator.vibrate(0);
    };
  }, [incomingCall]);

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
    callNotifySocketRef.current?.emit('call_invite', { roomId: roomIdToCall });
    navigate(`/call/${encodeURIComponent(roomIdToCall)}`);
  }

  if (!user) {
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
        <Route path="/requests" element={<RequestsPage />} />
        <Route path="/profile" element={<ProfilePage user={user} onLogout={handleLogout} />} />
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
      {!location.pathname.startsWith('/call/') && <BottomNav />}
    </div>
  );
}
