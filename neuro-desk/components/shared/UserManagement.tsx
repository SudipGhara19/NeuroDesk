'use client';

import { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from '@/components/providers/ThemeProvider';
import { fetchUsers, selectAllUsers, selectUsersLoading, selectUsersError, UserRecord, updateUserStatus, updateAiRestriction, deleteUser } from '@/lib/features/users/usersSlice';
import { selectCurrentUser } from '@/lib/features/auth/authSlice';
import { AppDispatch } from '@/lib/store';
import {
  BsSearch, BsPersonCircle, BsArrowRepeat, BsPlusLg
} from 'react-icons/bs';
import ConfirmModal from './ConfirmModal';
import CreateManagerModal from '../Admin/CreateManagerModal';
import UserProfileModal from '../modals/UserProfileModal';
import AnalyticsModal from '../modals/AnalyticsModal';
import UserRow from './UserRow';
import SkeletonCard from './UserListSkeleton';

/* ─── Props ───────────────────────────────────────────────── */
interface Props {
  /** If 'manager', Admin users are hidden from the list */
  viewMode: 'admin' | 'manager';
}

/* ─── Main Component ───────────────────────────────────────── */
export default function UserManagement({ viewMode }: Props) {
  const { theme } = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  const allUsers = useSelector(selectAllUsers);
  const loading = useSelector(selectUsersLoading);
  const error = useSelector(selectUsersError);
  const currentUser = useSelector(selectCurrentUser);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [actionError, setActionError] = useState<string | null>(null);
  const [showCreateManager, setShowCreateManager] = useState(false);
  const [selectedProfileUser, setSelectedProfileUser] = useState<UserRecord | null>(null);
  const [selectedStatsUser, setSelectedStatsUser] = useState<UserRecord | null>(null);
  
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    user: UserRecord | null;
    action: 'block' | 'unblock' | 'restrictAi' | 'allowAi' | 'delete' | null;
  }>({ isOpen: false, user: null, action: null });

  const handleActionClick = (u: UserRecord, act: 'block' | 'unblock' | 'restrictAi' | 'allowAi' | 'delete') => {
    setActionError(null);
    setConfirmModal({ isOpen: true, user: u, action: act });
  };

  const handleConfirmAction = async () => {
    if (!confirmModal.user || !confirmModal.action) return;
    
    setActionError(null);
    try {
      const { user, action } = confirmModal;
      
      switch (action) {
        case 'block':
          await dispatch(updateUserStatus(user._id)).unwrap();
          break;
        case 'unblock':
          await dispatch(updateUserStatus(user._id)).unwrap();
          break;
        case 'restrictAi':
          await dispatch(updateAiRestriction(user._id)).unwrap();
          break;
        case 'allowAi':
          await dispatch(updateAiRestriction(user._id)).unwrap();
          break;
        case 'delete':
          await dispatch(deleteUser(user._id)).unwrap();
          break;
      }
    } catch (err: unknown) {
      console.error('Failed to perform action:', err);
      setActionError(typeof err === 'string' ? err : 'Failed to perform the requested action.');
    } finally {
      setConfirmModal({ isOpen: false, user: null, action: null });
    }
  };

  // Always re-fetch for fresh data when this page mounts
  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  const baseUsers = useMemo(() => {
    const users = viewMode === 'manager'
      ? allUsers.filter((u) => u.role !== 'Admin')
      : allUsers;
    
    return users;
  }, [allUsers, viewMode]);

  // Filter by search + role
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return baseUsers.filter((u) => {
      // Hide logged-in user in 'all' view
      if (roleFilter === 'all' && currentUser?._id === u._id) {
        return false;
      }

      const matchSearch = !q
        || u.fullName.toLowerCase().includes(q)
        || u.email.toLowerCase().includes(q)
        || u.role.toLowerCase().includes(q);
      const matchRole = roleFilter === 'all' || u.role === roleFilter;
      return matchSearch && matchRole;
    });
  }, [baseUsers, search, roleFilter, currentUser?._id]);

  const roles = viewMode === 'admin' ? ['all', 'Admin', 'Manager', 'User'] : ['all', 'Manager', 'User'];

  return (
    <div className={`rounded-2xl border transition-colors ${
      theme === 'dark' ? 'bg-white/5 border-white/5 text-white' : 'bg-white border-gray-100 text-gray-800'
    }`}>
      {/* Header */}
      <div className={`p-4 sm:p-6 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
        theme === 'dark' ? 'border-white/5' : 'border-gray-100'
      }`}>
        <div>
          <h2 className="text-xl font-bold">User Management</h2>
          <p className={`text-sm mt-0.5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            {loading ? 'Fetching latest data…' : `${filtered.length} of ${baseUsers.length} users`}
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          {viewMode === 'admin' && (
            <button
              onClick={() => setShowCreateManager(true)}
              className="inline-flex items-center gap-2 px-3 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-xl transition-all active:scale-95"
            >
              <BsPlusLg /> Create Manager
            </button>
          )}
          {/* Refresh */}
          <button
            onClick={() => dispatch(fetchUsers())}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${
              theme === 'dark' ? 'bg-white/5 hover:bg-white/10 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
            } ${loading ? 'animate-spin pointer-events-none' : ''}`}
          >
            <BsArrowRepeat className={loading ? 'animate-spin' : ''} />
            <span className={loading ? 'opacity-0' : ''}>Refresh</span>
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-4">
        {/* Search + role filter row */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className={`flex items-center gap-2 flex-1 px-3 py-2 rounded-xl border text-sm ${
            theme === 'dark'
              ? 'bg-white/5 border-white/5 text-gray-300 placeholder:text-gray-500'
              : 'bg-gray-50 border-gray-200 text-gray-700 placeholder:text-gray-400'
          }`}>
            <BsSearch className="shrink-0 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email or role…"
              className="flex-1 bg-transparent outline-none text-sm"
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xs font-bold">
                ✕
              </button>
            )}
          </div>

          {/* Role filter pills */}
          <div className={`flex items-center gap-1 p-1 rounded-xl border ${
            theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-gray-100 border-gray-200'
          }`}>
            {roles.map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                  roleFilter === r
                    ? theme === 'dark'
                      ? 'bg-white text-black'
                      : 'bg-black text-white'
                    : theme === 'dark'
                      ? 'text-gray-400 hover:text-white'
                      : 'text-gray-500 hover:text-black'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {(error || actionError) && (
          <div className={`p-3 rounded-xl border text-sm font-medium ${
            theme === 'dark' ? 'bg-red-500/10 border-red-500/20 text-red-300' : 'bg-red-50 border-red-200 text-red-600'
          }`}>
            ⚠️ {error || actionError}
          </div>
        )}

        {/* User list */}
        <div className="space-y-2">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} theme={theme} />)
            : filtered.length === 0
              ? (
                <div className={`py-16 text-center text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                  <BsPersonCircle className="mx-auto text-3xl mb-2 opacity-30" />
                  No users match your search.
                </div>
              )
              : filtered.map((user) => (
                  <UserRow
                    key={user._id}
                    user={user}
                    isSelf={currentUser?._id === user._id}
                    theme={theme}
                    viewMode={viewMode}
                    onAction={handleActionClick}
                    onViewProfile={setSelectedProfileUser}
                    onViewStats={setSelectedStatsUser}
                  />
                ))}
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={handleConfirmAction}
        title={
          confirmModal.action === 'block' ? 'Block User' :
          confirmModal.action === 'unblock' ? 'Unblock User' :
          confirmModal.action === 'restrictAi' ? 'Restrict AI Access' :
          confirmModal.action === 'allowAi' ? 'Unrestrict AI Use' :
          'Delete User'
        }
        message={
          confirmModal.action === 'block' ? `Are you sure you want to block ${confirmModal.user?.fullName}? They will not be able to log in.` :
          confirmModal.action === 'unblock' ? `Are you sure you want to unblock ${confirmModal.user?.fullName}?` :
          confirmModal.action === 'restrictAi' ? `Are you sure you want to restrict AI access for ${confirmModal.user?.fullName}? They will no longer be able to use the AI Assistant.` :
          confirmModal.action === 'allowAi' ? `Are you sure you want to unrestrict AI access for ${confirmModal.user?.fullName}?` :
          `Are you sure you want to permanently delete ${confirmModal.user?.fullName}? This action cannot be undone.`
        }
        confirmText={
          confirmModal.action === 'block' ? 'Block' :
          confirmModal.action === 'unblock' ? 'Unblock' :
          confirmModal.action === 'restrictAi' ? 'Restrict' :
          confirmModal.action === 'allowAi' ? 'Unrestrict' :
          'Delete'
        }
        confirmVariant={
          confirmModal.action === 'delete' || confirmModal.action === 'block' ? 'danger' :
          confirmModal.action === 'restrictAi' ? 'warning' : 'success'
        }
      />

      <CreateManagerModal
        isOpen={showCreateManager}
        onClose={() => setShowCreateManager(false)}
      />

      <UserProfileModal
        isOpen={!!selectedProfileUser}
        onClose={() => setSelectedProfileUser(null)}
        user={selectedProfileUser}
        theme={theme}
      />

      <AnalyticsModal
        isOpen={!!selectedStatsUser}
        onClose={() => setSelectedStatsUser(null)}
        user={selectedStatsUser}
        theme={theme}
      />
    </div>
  );
}
