import { useState, useEffect } from 'react';

// Use env in production when backend is on another origin; in dev Vite proxies /api
const API = import.meta.env.VITE_API_URL ?? '/api';

export default function App() {
  const [status, setStatus] = useState('checking');

  useEffect(() => {
    fetch(`${API}/health`)
      .then((res) => res.json())
      .then((data) => setStatus(data.ok ? 'connected' : 'error'))
      .catch(() => setStatus('error'));
  }, []);

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>Chat</h1>
      <p>
        Backend: {status === 'checking' && 'Checking...'}
        {status === 'connected' && 'Connected'}
        {status === 'error' && 'Not connected (start the backend)'}
      </p>
    </div>
  );
}
