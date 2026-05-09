'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import { TableSkeleton } from '@/components/ui/LoadingSkeleton';
import EmptyState from '@/components/ui/EmptyState';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import {
  UsersIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';

interface User {
  user_id: number;
  full_name: string;
  email: string;
  role: string;
  cnic: string;
  phone_number: string;
  is_active: boolean;
  created_at: string;
}

const ROLES = ['user', 'staff', 'funeral_coordinator', 'cemetery_manager', 'admin'];

const ROLE_LABELS: Record<string, string> = {
  user: 'User',
  staff: 'Staff',
  funeral_coordinator: 'Funeral Coordinator',
  cemetery_manager: 'Cemetery Manager',
  admin: 'Administrator',
};

const ROLE_COLORS: Record<string, string> = {
  user: 'bg-gray-100 text-gray-700',
  staff: 'bg-blue-100 text-blue-700',
  funeral_coordinator: 'bg-purple-100 text-purple-700',
  cemetery_manager: 'bg-amber-100 text-amber-700',
  admin: 'bg-red-100 text-red-700',
};

export default function AdminUsersPage() {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [editingUser, setEditingUser] = useState<number | null>(null);
  const [newRole, setNewRole] = useState('');

  useEffect(() => {
    if (currentUser && currentUser.role !== 'admin') {
      router.push('/unauthorized');
      return;
    }
    fetchUsers();
  }, [currentUser, roleFilter]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (roleFilter) params.append('role', roleFilter);
      const res = await api.get(`/users?${params}`);
      setUsers(res.data.users || []);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setError('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (userId: number, currentStatus: boolean) => {
    try {
      await api.put(`/users/${userId}/toggle-active`);
      setUsers(users.map(u =>
        u.user_id === userId ? { ...u, is_active: !currentStatus } : u
      ));
    } catch (err) {
      console.error('Failed to toggle user status:', err);
    }
  };

  const handleRoleChange = async (userId: number) => {
    if (!newRole) return;
    try {
      await api.put(`/users/${userId}/role`, { role: newRole });
      setUsers(users.map(u =>
        u.user_id === userId ? { ...u, role: newRole } : u
      ));
      setEditingUser(null);
      setNewRole('');
    } catch (err) {
      console.error('Failed to update role:', err);
    }
  };

  const filteredUsers = users.filter(u =>
    u.full_name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  if (currentUser?.role !== 'admin') return null;

  return (
    <div>
      <Header title="Users" />

      <div className="p-6 lg:p-8">
        <div className="card mb-6">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="label">Search</label>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input-field pl-9"
                  placeholder="Search by name or email..."
                />
              </div>
            </div>
            <div className="w-48">
              <label className="label">Role</label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="input-field"
              >
                <option value="">All Roles</option>
                {ROLES.map(role => (
                  <option key={role} value={role}>{ROLE_LABELS[role]}</option>
                ))}
              </select>
            </div>
            <Link href="/admin/users/create" className="btn-primary">
              <PlusIcon className="w-4 h-4" />
              Add User
            </Link>
          </div>
        </div>

        <div className="card">
          {isLoading ? (
            <TableSkeleton rows={6} columns={6} />
          ) : error ? (
            <EmptyState
              title="Error loading users"
              description={error}
              icon={UsersIcon}
            />
          ) : filteredUsers.length === 0 ? (
            <EmptyState
              title="No users found"
              description="No users match your search criteria."
              icon={UsersIcon}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="table-header">
                  <tr>
                    <th className="px-4 py-3 text-left">Name</th>
                    <th className="px-4 py-3 text-left">Email</th>
                    <th className="px-4 py-3 text-left">Role</th>
                    <th className="px-4 py-3 text-left">CNIC</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.user_id} className="table-row">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {user.full_name}
                      </td>
                      <td className="px-4 py-3 text-gray-500">{user.email}</td>
                      <td className="px-4 py-3">
                        {editingUser === user.user_id ? (
                          <div className="flex items-center gap-2">
                            <select
                              value={newRole}
                              onChange={(e) => setNewRole(e.target.value)}
                              className="input-field text-sm py-1"
                            >
                              <option value="">Select role</option>
                              {ROLES.map(role => (
                                <option key={role} value={role}>{ROLE_LABELS[role]}</option>
                              ))}
                            </select>
                            <button
                              onClick={() => handleRoleChange(user.user_id)}
                              className="text-[#2D6A4F] text-sm font-medium"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => { setEditingUser(null); setNewRole(''); }}
                              className="text-gray-500 text-sm"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${ROLE_COLORS[user.role]}`}>
                            {ROLE_LABELS[user.role] || user.role}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500">{user.cnic || '-'}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleToggleActive(user.user_id, user.is_active)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            user.is_active ? 'bg-[#2D6A4F]' : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              user.is_active ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => { setEditingUser(user.user_id); setNewRole(user.role); }}
                          className="text-[#2D6A4F] hover:text-[#245c43]"
                          title="Edit Role"
                        >
                          <PencilIcon className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
