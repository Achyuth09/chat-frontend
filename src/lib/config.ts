export const API = import.meta.env.VITE_API_URL ?? '/api';
export const SOCKET_URL = import.meta.env.VITE_API_URL
  ? new URL(import.meta.env.VITE_API_URL).origin
  : 'http://localhost:5000';

export const TOKEN_KEY = 'chat_token';
export const USER_KEY = 'chat_user';

export const RTC_CONFIG: RTCConfiguration = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
};
