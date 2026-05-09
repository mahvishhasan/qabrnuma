'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import { TableSkeleton } from '@/components/ui/LoadingSkeleton';
import EmptyState from '@/components/ui/EmptyState';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { ShieldCheckIcon, CheckIcon } from '@heroicons/react/24/outline';

interface User {
  user_id: number;
  full_name: string;
  email: string;
  role: string;
}

const ROLES = ['user', 'staff', 'funeral_coordinator', 'cemetery_manager', 'admin'];

const ROLE_LABELS: Record<string, string> = {
  user: 'User',
  staff: 'Staff',
  funeral_coordinator: 'Funeral Coordinator',
  cemetery_manager: 'Cemetery Manager',
  admin: 'Administrator',
};

export default function AdminRolesPage() {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [pendingChanges, setPendingChanges] = useState<Record<number, string>>({});
  const [savingUser, setSavingUser] = useState<number | null>(null);

  useEffect(() => {
    if (currentUser && currentUser.role !== 'admin') {
      router.push('/unauthorized');
      return;
    }
    fetchUsers();
  }, [currentUser]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/users');
      setUsers(res.data.users || []);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setError('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleSelect = (userId: number, role: string) => {
    setPendingChanges({ ...pendingChanges, [userId]: role });
  };

  const handleSave = async (userId: number) => {
    const newRole = pendingChanges[userId];
    if (!newRole) return;

    setSavingUser(userId);
    try {
      await api.put(`/users/${userId}/role`, { role: newRole });
      setUsers(users.map(u =>
        u.user_id === userId ? { ...u, role: newRole } : u
      ));
      const { [userId]: _, ...rest } = pendingChanges;
      setPendingChanges(rest);
    } catch (err) {
      console.error('Failed to update role:', err);
    } finally {
      setSavingUser(null);
    }
  };

  if (currentUser?.role !== 'admin') return null;

  return (
    <div>
      <Header title="Role Management" />

      <div className="p-6 lg:p-8">
        <div className="card mb-6">
          <p className="text-gray-600">
            Manage user roles and permissions. Changes take effect immediately after saving.
          </p>
        </div>

        <div className="card">
          {isLoading ? (
            <TableSkeleton rows={6} columns={4} />
          ) : error ? (
            <EmptyState
              title="Error loading users"
              description={error}
              icon={ShieldCheckIcon}
            />
          ) : users.length === 0 ? (
            <EmptyState
              title="No users found"
              description="No users in the system."
              icon={ShieldCheckIcon}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="table-header">
                  <tr>
                    <th className="px-4 py-3 text-left">Name</th>
                    <th className="px-4 py-3 text-left">Email</th>
                    <th className="px-4 py-3 text-left">Current Role</th>
                    <th className="px-4 py-3 text-left">Change Role</th>
                    <th className="px-4 py-3 text-left">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => {
                    const hasPendingChange = pendingChanges[user.user_id] && pendingChanges[user.user_id] !== user.role;
                    return (
                      <tr key={user.user_id} className="table-row">
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {user.full_name}
                        </td>
                        <td className="px-4 py-3 text-gray-500">{user.email}</td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-medium text-gray-700">
                            {ROLE_LABELS[user.role] || user.role}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={pendingChanges[user.user_id] || user.role}
                            onChange={(e) => handleRoleSelect(user.user_id, e.target.value)}
                            className={`input-field text-sm py-1.5 ${hasPendingChange ? 'border-[#2D6A4F] ring-1 ring-[#2D6A4F]' : ''}`}
                          >
                            {ROLES.map(role => (
                              <option key={role} value={role}>{ROLE_LABELS[role]}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          {hasPendingChange && (
                            <button
                              onClick={() => handleSave(user.user_id)}
                              disabled={savingUser === user.user_id}
                              className="btn-primary text-sm py-1.5 px-3 disabled:opacity-50"
                            >
                              {savingUser === user.user_id ? (
                                'Saving...'
                              ) : (
                                <>
                                  <CheckIcon className="w-4 h-4" />
                                  Save
                                </>
                              )}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
