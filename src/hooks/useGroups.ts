import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { API } from '../lib/config';
import type { ChatUser, Group } from '../types';

interface UseGroupsArgs {
  token: string | null;
  user: ChatUser | null;
  makeHeaders: (extra?: Record<string, string>) => Record<string, string>;
}

export function useGroups({ token, user, makeHeaders }: UseGroupsArgs) {
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [homeError, setHomeError] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [memberUsername, setMemberUsername] = useState('');

  async function refreshHomeData(activeToken = token, activeUser = user) {
    if (!activeToken || !activeUser) return;
    setHomeError('');
    try {
      const headers = { Authorization: `Bearer ${activeToken}` };
      const [usersRes, groupsRes] = await Promise.all([
        fetch(`${API}/users`, { headers }),
        fetch(`${API}/groups`, { headers }),
      ]);
      const [usersData, groupsData] = await Promise.all([usersRes.json(), groupsRes.json()]);
      setUsers(Array.isArray(usersData) ? (usersData as ChatUser[]) : []);
      setGroups(Array.isArray(groupsData) ? (groupsData as Group[]) : []);
    } catch {
      setHomeError('Could not load users/groups');
    }
  }

  useEffect(() => {
    if (!token || !user) return;
    refreshHomeData();
  }, [token, user]);

  async function handleCreateGroup(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const name = newGroupName.trim();
    if (!name) return;
    setHomeError('');
    try {
      const res = await fetch(`${API}/groups`, {
        method: 'POST',
        headers: makeHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ name }),
      });
      const data = (await res.json()) as Group & { error?: string };
      if (data.error) return setHomeError(data.error);
      setGroups((prev) => [data, ...prev]);
      setNewGroupName('');
    } catch {
      setHomeError('Failed to create group');
    }
  }

  async function handleAddMember(e: FormEvent<HTMLFormElement>, selectedGroup: Group | null) {
    e.preventDefault();
    const username = memberUsername.trim();
    if (!selectedGroup || !username) return null;
    try {
      const res = await fetch(`${API}/groups/${selectedGroup.id}/members`, {
        method: 'POST',
        headers: makeHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ username }),
      });
      const data = (await res.json()) as Group & { error?: string };
      if (data.error) {
        setHomeError(data.error);
        return null;
      }
      setGroups((prev) => prev.map((g) => (g.id === data.id ? data : g)));
      setMemberUsername('');
      return data;
    } catch {
      setHomeError('Failed to add member');
      return null;
    }
  }

  async function removeMember(memberId: string, selectedGroup: Group | null) {
    if (!selectedGroup) return null;
    try {
      const res = await fetch(`${API}/groups/${selectedGroup.id}/members/${memberId}`, {
        method: 'DELETE',
        headers: makeHeaders(),
      });
      const data = (await res.json()) as Group & { error?: string };
      if (data.error) {
        setHomeError(data.error);
        return null;
      }
      setGroups((prev) => prev.map((g) => (g.id === data.id ? data : g)));
      return data;
    } catch {
      setHomeError('Failed to remove member');
      return null;
    }
  }

  function clearGroupInputs() {
    setNewGroupName('');
    setMemberUsername('');
  }

  return {
    users,
    groups,
    homeError,
    newGroupName,
    setNewGroupName,
    memberUsername,
    setMemberUsername,
    refreshHomeData,
    handleCreateGroup,
    handleAddMember,
    removeMember,
    clearGroupInputs,
  };
}
