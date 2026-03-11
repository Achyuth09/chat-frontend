import { useState } from 'react';
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <div className="app">
      <div className="auth-card">
        <div className="auth-logo" aria-hidden>
          <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="auth-logo-g" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#f43f5e" />
              </linearGradient>
            </defs>
            <path
              d="M32 8 L52 20 L52 44 L32 56 L12 44 L12 20 Z"
              fill="url(#auth-logo-g)"
              stroke="rgba(255,255,255,0.3)"
              strokeWidth="2"
            />
            <path d="M32 20 L44 26 L44 38 L32 44 L20 38 L20 26 Z" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
          </svg>
        </div>
        <h1>Hive</h1>
        <p className="auth-subtitle">Your community: posts, messages, and calls.</p>
        <p className="status">
          {status === 'checking' && 'Checking...'}
          {status === 'connected' && 'Sign in or create an account'}
          {status === 'error' && 'Cannot reach server'}
        </p>
        <form onSubmit={onSubmit}>
          <input name="username" type="text" placeholder="Username" autoComplete="username" />
          <div className="auth-password-wrap">
            <input
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'}
            />
            <button
              type="button"
              className="auth-pass-toggle"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="2" />
                  <line
                    x1="4"
                    y1="4"
                    x2="20"
                    y2="20"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="2" />
                </svg>
              )}
            </button>
          </div>
          {authMode === 'signup' && (
            <div className="auth-password-wrap">
              <input
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm Password"
                autoComplete="new-password"
              />
              <button
                type="button"
                className="auth-pass-toggle"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                title={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
              >
                {showConfirmPassword ? (
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="2" />
                    <line
                      x1="4"
                      y1="4"
                      x2="20"
                      y2="20"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="2" />
                  </svg>
                )}
              </button>
            </div>
          )}
          {authMode === 'signup' && (
            <p className="auth-hint">
              Use at least 8 characters with uppercase, lowercase, number, and symbol.
            </p>
          )}
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
