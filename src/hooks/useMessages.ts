import { useCallback, useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { io, type Socket } from 'socket.io-client';
import { API, SOCKET_URL } from '../lib/config';
import type { ChatMessage, ChatUser, MediaAttachment } from '../types';

interface UseMessagesArgs {
  token: string | null;
  user: ChatUser | null;
  inMessages: boolean;
  roomId: string;
  makeHeaders: (extra?: Record<string, string>) => Record<string, string>;
}

export function useMessages({ token, user, inMessages, roomId, makeHeaders }: UseMessagesArgs) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sendingMedia, setSendingMedia] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLLIElement | null>(null);

  useEffect(() => {
    if (!inMessages || !roomId || !token || !user) return;

    const socket = io(SOCKET_URL, { auth: { token } });
    socketRef.current = socket;

    const joinRoom = () => socket.emit('join_room', roomId);
    socket.on('connect', joinRoom);
    if (socket.connected) joinRoom();

    fetch(`${API}/messages?roomId=${encodeURIComponent(roomId)}`, { headers: makeHeaders() })
      .then((res) => res.json())
      .then((data) => setMessages(Array.isArray(data) ? (data as ChatMessage[]) : []))
      .catch(() => setMessages([]));

    socket.on('new_message', (message: ChatMessage) => setMessages((prev) => [...prev, message]));

    return () => {
      socket.off('connect');
      socket.off('new_message');
      socket.disconnect();
      socketRef.current = null;
    };
  }, [inMessages, roomId, token, user, makeHeaders]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function handleSend(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const text = input.trim();
    if (!text || !socketRef.current) return;
    socketRef.current.emit('send_message', { roomId, text });
    setInput('');
  }

  async function sendMediaMessage(file: File) {
    if (!file || !socketRef.current || !token || !roomId) return;
    setSendingMedia(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const uploadRes = await fetch(`${API}/upload`, {
        method: 'POST',
        headers: makeHeaders(),
        body: fd,
      });
      const uploadData = await uploadRes.json();
      if (uploadData.error || !uploadData.url) return;

      const attachment: MediaAttachment = {
        url: uploadData.url,
        publicId: uploadData.publicId || '',
        type: uploadData.type || 'raw',
        width: uploadData.width || null,
        height: uploadData.height || null,
        duration: uploadData.duration || null,
        originalName: uploadData.originalName || file.name,
      };

      socketRef.current.emit('send_message', {
        roomId,
        text: '',
        attachments: [attachment],
      });
    } finally {
      setSendingMedia(false);
    }
  }

  const clearMessages = useCallback(() => {
    setMessages((prev) => (prev.length ? [] : prev));
    setInput((prev) => (prev ? '' : prev));
  }, []);

  return {
    messages,
    input,
    setInput,
    handleSend,
    messagesEndRef,
    clearMessages,
    sendMediaMessage,
    sendingMedia,
    socketRef,
  };
}
