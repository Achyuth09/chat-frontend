import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const API = import.meta.env.VITE_API_URL ?? '/api';
const SOCKET_URL = import.meta.env.VITE_API_URL
  ? new URL(import.meta.env.VITE_API_URL).origin
  : 'http://localhost:5000';

const TOKEN_KEY = 'chat_token';
const USER_KEY = 'chat_user';

function getStoredAuth() {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const userJson = localStorage.getItem(USER_KEY);
    const user = userJson ? JSON.parse(userJson) : null;
    return { token, user };
  } catch {
    return { token: null, user: null };
  }
}

function dmRoomId(myId, otherId) {
  const [a, b] = [myId, otherId].sort();
  return `dm:${a}:${b}`;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [authMode, setAuthMode] = useState('signin');
  const [authError, setAuthError] = useState('');
  const [status, setStatus] = useState('checking');
  const [users, setUsers] = useState([]);
  const [joined, setJoined] = useState(false);
  const [roomId, setRoomId] = useState('');
  const [roomLabel, setRoomLabel] = useState('');
  const [roomInput, setRoomInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Restore session
  useEffect(() => {
    const { token: t, user: u } = getStoredAuth();
    if (!t) {
      setStatus('connected');
      return;
    }
    fetch(`${API}/auth/me`, {
      headers: { Authorization: `Bearer ${t}` },
    })
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error('Session invalid');
      })
      .then((data) => {
        setToken(t);
        setUser(data.user || u);
        if (data.user) localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      })
      .finally(() => setStatus('connected'));
  }, []);

  // Health check when no token
  useEffect(() => {
    if (token) return;
    fetch(`${API}/health`)
      .then((res) => res.json())
      .then((data) => setStatus(data.ok ? 'connected' : 'error'))
      .catch(() => setStatus('error'));
  }, [token]);

  // Load users when logged in and not in a chat
  useEffect(() => {
    if (!token || !user || joined) return;
    fetch(`${API}/users`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setUsers(Array.isArray(data) ? data : []))
      .catch(() => setUsers([]));
  }, [token, user, joined]);

  // Socket + messages when in a room
  useEffect(() => {
    if (!joined || !roomId || !token || !user) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
    });
    socketRef.current = socket;

    const joinRoom = () => socket.emit('join_room', roomId);
    socket.on('connect', joinRoom);
    if (socket.connected) joinRoom();

    fetch(`${API}/messages?roomId=${encodeURIComponent(roomId)}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setMessages(Array.isArray(data) ? data : []))
      .catch(() => setMessages([]));

    socket.on('new_message', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      socket.off('connect');
      socket.off('new_message');
      socket.disconnect();
      socketRef.current = null;
    };
  }, [joined, roomId, token, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function handleAuth(e) {
    e.preventDefault();
    const form = e.target;
    const username = form.username?.value?.trim();
    const password = form.password?.value;
    setAuthError('');
    if (!username || !password) {
      setAuthError('Username and password required');
      return;
    }
    if (password.length < 6) {
      setAuthError('Password must be at least 6 characters');
      return;
    }
    const url = authMode === 'signup' ? `${API}/auth/signup` : `${API}/auth/login`;
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setAuthError(data.error);
          return;
        }
        localStorage.setItem(TOKEN_KEY, data.token);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
      })
      .catch(() => setAuthError('Request failed'));
  }

  function handleLogout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
    setJoined(false);
    setRoomId('');
    setRoomLabel('');
  }

  function handleJoinRoom(e) {
    e.preventDefault();
    const r = roomInput.trim();
    if (!r) return;
    setRoomId(r);
    setRoomLabel(r);
    setJoined(true);
  }

  function openDm(otherUser) {
    const id = dmRoomId(user.id, otherUser.id);
    setRoomId(id);
    setRoomLabel(otherUser.username);
    setJoined(true);
  }

  function leaveChat() {
    setJoined(false);
    setRoomId('');
    setRoomLabel('');
    setMessages([]);
  }

  function handleSend(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || !socketRef.current) return;
    socketRef.current.emit('send_message', { roomId, text });
    setInput('');
  }

  // ----- Auth screen -----
  if (!user) {
    return (
      <div className="app">
        <div className="auth-card">
          <h1>Chat</h1>
          <p className="status">
            {status === 'checking' && 'Checking...'}
            {status === 'connected' && 'Sign in or create an account'}
            {status === 'error' && 'Cannot reach server'}
          </p>
          <form onSubmit={handleAuth}>
            <input
              name="username"
              type="text"
              placeholder="Username"
              autoComplete="username"
            />
            <input
              name="password"
              type="password"
              placeholder="Password (min 6)"
              autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'}
            />
            {authError && <p className="auth-error">{authError}</p>}
            <button type="submit">
              {authMode === 'signup' ? 'Sign up' : 'Sign in'}
            </button>
          </form>
          <button
            type="button"
            className="auth-toggle"
            onClick={() => {
              setAuthMode((m) => (m === 'signin' ? 'signup' : 'signin'));
              setAuthError('');
            }}
          >
            {authMode === 'signin' ? 'Create an account' : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    );
  }

  // ----- Home: pick room or DM -----
  if (!joined) {
    return (
      <div className="app home-view">
        <header className="home-header">
          <span>Hi, {user.username}</span>
          <button type="button" className="logout-btn" onClick={handleLogout}>
            Log out
          </button>
        </header>
        <div className="home-content">
          <section className="home-section">
            <h2>Join a room</h2>
            <form onSubmit={handleJoinRoom}>
              <input
                type="text"
                placeholder="Room name (e.g. general)"
                value={roomInput}
                onChange={(e) => setRoomInput(e.target.value)}
                autoComplete="off"
              />
              <button type="submit">Join room</button>
            </form>
          </section>
          <section className="home-section">
            <h2>Direct messages</h2>
            <ul className="users-list">
              {users.length === 0 && <li className="users-empty">No other users yet</li>}
              {users.map((u) => (
                <li key={u.id}>
                  <button type="button" onClick={() => openDm(u)}>
                    {u.username}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    );
  }

  // ----- Chat view -----
  return (
    <div className="app chat-view">
      <header className="chat-header">
        <button type="button" className="back-btn" onClick={leaveChat} aria-label="Back">
          ←
        </button>
        <span className="room-name">{roomLabel}</span>
        <span className="you">{user.username}</span>
      </header>
      <ul className="message-list">
        {messages.length === 0 && (
          <li className="empty-hint">No messages yet. Say hi!</li>
        )}
        {messages.map((m) => (
          <li
            key={m._id}
            className={m.sender === user.username ? 'msg you' : 'msg other'}
          >
            <span className="sender">{m.sender}</span>
            <span className="text">{m.text}</span>
            {m.createdAt && (
              <span className="time">
                {new Date(m.createdAt).toLocaleTimeString()}
              </span>
            )}
          </li>
        ))}
        <li ref={messagesEndRef} aria-hidden="true" />
      </ul>
      <form onSubmit={handleSend} className="input-form">
        <input
          type="text"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          autoComplete="off"
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}
