import type { FormEvent } from 'react';
import type { AuthMode, HealthStatus } from '../types';

interface AuthPageProps {
  status: HealthStatus;
  authMode: AuthMode;
  authError: string;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onToggleMode: () => void;
}

export default function AuthPage({
  status,
  authMode,
  authError,
  onSubmit,
  onToggleMode,
}: AuthPageProps) {
  return (
    <div className="app">
      <div className="auth-card">
        <h1>Chat</h1>
        <p className="status">
          {status === 'checking' && 'Checking...'}
          {status === 'connected' && 'Sign in or create an account'}
          {status === 'error' && 'Cannot reach server'}
        </p>
        <form onSubmit={onSubmit}>
          <input name="username" type="text" placeholder="Username" autoComplete="username" />
          <input
            name="password"
            type="password"
            placeholder="Password (min 6)"
            autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'}
          />
          {authError && <p className="auth-error">{authError}</p>}
          <button type="submit">{authMode === 'signup' ? 'Sign up' : 'Sign in'}</button>
        </form>
        <button type="button" className="auth-toggle" onClick={onToggleMode}>
          {authMode === 'signin'
            ? 'Create an account'
            : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>
  );
}
