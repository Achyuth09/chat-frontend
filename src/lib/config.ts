export const API = import.meta.env.VITE_API_URL ?? '/api';
export const SOCKET_URL = import.meta.env.VITE_API_URL
  ? new URL(import.meta.env.VITE_API_URL).origin
  : 'http://localhost:5000';

export const TOKEN_KEY = 'chat_token';
export const USER_KEY = 'chat_user';

const turnUrls = String(import.meta.env.VITE_TURN_URLS || '')
  .split(',')
  .map((x) => x.trim())
  .filter(Boolean);
const turnUsername = String(import.meta.env.VITE_TURN_USERNAME || '').trim();
const turnCredential = String(import.meta.env.VITE_TURN_CREDENTIAL || '').trim();

export const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    ...(turnUrls.length
      ? [
          {
            urls: turnUrls,
            username: turnUsername || undefined,
            credential: turnCredential || undefined,
          },
        ]
      : []),
  ],
};
