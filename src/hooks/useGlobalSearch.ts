import { useEffect, useState } from 'react';
import { API } from '../lib/config';
import type { ChatUser } from '../types';

interface UseGlobalSearchArgs {
  token: string | null;
  user: { id: string } | null;
  makeHeaders: (extra?: Record<string, string>) => Record<string, string>;
}

export function useGlobalSearch({ token, user, makeHeaders }: UseGlobalSearchArgs) {
  const [globalSearch, setGlobalSearch] = useState('');
  const [globalSearching, setGlobalSearching] = useState(false);
  const [globalSearchResults, setGlobalSearchResults] = useState<ChatUser[]>([]);
  const [globalSearchError, setGlobalSearchError] = useState('');
  const [globalSendingTo, setGlobalSendingTo] = useState('');

  useEffect(() => {
    const q = globalSearch.trim();
    if (!token || !user || !q) {
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
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [globalSearch, token, user, makeHeaders]);

  return {
    globalSearch,
    setGlobalSearch,
    globalSearching,
    globalSearchResults,
    globalSearchError,
    setGlobalSearchError,
    globalSendingTo,
    setGlobalSendingTo,
  };
}
