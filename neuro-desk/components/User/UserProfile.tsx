'use client';

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from '@/components/providers/ThemeProvider';
import { 
  selectCurrentUser, 
  fetchProfile, 
  updateProfile, 
  selectProfileLoading, 
  selectProfileError,
  logout
} from '@/lib/features/auth/authSlice';
import { AppDispatch } from '@/lib/store';
import { BsPersonBadge, BsPencilSquare, BsCheckCircleFill, BsXCircleFill, BsTrashFill } from 'react-icons/bs';
import ConfirmModal from '@/components/shared/ConfirmModal';

export default function UserProfile() {
  const { theme } = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector(selectCurrentUser);
  const loading = useSelector(selectProfileLoading);
  const error = useSelector(selectProfileError);

  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    department: '',
    bio: '',
    phone: '',
    address: ''
  });

  useEffect(() => {
    dispatch(fetchProfile());
  }, [dispatch]);

  const handleSave = async () => {
    try {
      await dispatch(updateProfile(formData)).unwrap();
      setIsEditing(false);
    } catch (err) {
      // Error is handled by global error state
      console.error(err);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    try {
      setIsDeleting(true);
      setDeleteError(null);
      // Let's use the native fetch or axios instance directly to avoid tying user's profile to the 'users' slice
      const api = (await import('@/lib/axios')).default;
      await api.delete(`/users/${user._id}`);
      dispatch(logout());
      // Handled automatically due to auth change to generic login page
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      setDeleteError(error?.response?.data?.message || error?.message || 'Failed to delete account.');
      console.error(err);
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (!user) return null;

  const initials = user.fullName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const roleBadge: Record<string, string> = {
    Admin: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300',
    Manager: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300',
    User: 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300',
  };

  return (
    <div className={`max-w-5xl mx-auto rounded-2xl border transition-colors ${
      theme === 'dark' ? 'bg-white/5 border-white/5 text-white' : 'bg-white border-gray-100 text-gray-800'
    }`}>
      {/* Header */}
      <div className={`p-6 sm:p-8 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
        theme === 'dark' ? 'border-white/5' : 'border-gray-100'
      }`}>
        <div className="flex items-center gap-3">
          <BsPersonBadge className="text-2xl text-primary" />
          <h2 className="text-xl font-bold">My Profile</h2>
        </div>
        
        {!isEditing && (
          <button
            onClick={() => {
              setFormData({
                fullName: user.fullName || '',
                department: user.userData?.department || user.department || '',
                bio: user.userData?.bio || user.bio || '',
                phone: user.userData?.phone || user.phone || '',
                address: user.userData?.address || user.address || ''
              });
              setIsEditing(true);
            }}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all active:scale-95 ${
              theme === 'dark' ? 'bg-white/5 hover:bg-white/10 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
            }`}
          >
            <BsPencilSquare />
            Edit Profile
          </button>
        )}
      </div>

      <div className="p-6 sm:p-8 space-y-8">
        {/* Error */}
        {(error || deleteError) && (
          <div className={`p-4 rounded-xl border text-sm font-medium flex items-center gap-2 ${
            theme === 'dark' ? 'bg-red-500/10 border-red-500/20 text-red-300' : 'bg-red-50 border-red-200 text-red-600'
          }`}>
            <BsXCircleFill /> {error || deleteError}
          </div>
        )}

        {/* Top Info Section: Avatar + Name/Email */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="shrink-0 relative">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-linear-to-tr from-primary to-primary-dark flex items-center justify-center text-white text-3xl sm:text-4xl font-black shadow-xl ring-4 ring-primary/20">
              {initials}
            </div>
            <span className={`absolute bottom-2 right-2 w-5 h-5 rounded-full border-4 ${
              theme === 'dark' ? 'border-[#121212]' : 'border-white'
            } bg-green-500`} title="Online" />
          </div>

          <div className="flex-1 text-center sm:text-left space-y-2 pt-2">
            {isEditing ? (
              <div className="space-y-1">
                <label className={`block text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Full Name</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className={`w-full max-w-md px-4 py-2 rounded-xl border text-base font-bold transition-colors ${
                    theme === 'dark'
                      ? 'bg-black/20 border-white/10 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none'
                      : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-primary focus:ring-1 focus:ring-primary outline-none'
                  }`}
                  placeholder="Your full name"
                  disabled={loading}
                />
              </div>
            ) : (
              <>
                <h1 className="text-2xl sm:text-3xl font-black">{user.fullName}</h1>
                <p className={`text-base ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{user.email}</p>
                <div className="pt-2">
                  <span className={`inline-flex px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${roleBadge[user.role] || roleBadge.User}`}>
                    {user.role}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Form Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-100 dark:border-white/5">
          
          {/* Department */}
          <div className="space-y-1">
            <label className={`block text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              Department / Team
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className={`w-full px-4 py-3 rounded-xl border text-sm transition-colors ${
                  theme === 'dark'
                    ? 'bg-black/20 border-white/10 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none'
                    : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-primary focus:ring-1 focus:ring-primary outline-none'
                }`}
                placeholder="e.g. Engineering, HR, Marketing"
                disabled={loading}
              />
            ) : (
              <p className={`text-sm font-medium ${(user.userData?.department || user.department) ? '' : theme === 'dark' ? 'text-gray-500 italic' : 'text-gray-400 italic'}`}>
                {user.userData?.department || user.department || 'Not specified'}
              </p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-1">
            <label className={`block text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              Phone Number
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className={`w-full px-4 py-3 rounded-xl border text-sm transition-colors ${
                  theme === 'dark'
                    ? 'bg-black/20 border-white/10 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none'
                    : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-primary focus:ring-1 focus:ring-primary outline-none'
                }`}
                placeholder="e.g. +1 (555) 123-4567"
                disabled={loading}
              />
            ) : (
              <p className={`text-sm font-medium ${(user.userData?.phone || user.phone) ? '' : theme === 'dark' ? 'text-gray-500 italic' : 'text-gray-400 italic'}`}>
                {user.userData?.phone || user.phone || 'Not specified'}
              </p>
            )}
          </div>

          {/* Address */}
          <div className="space-y-1 md:col-span-2">
            <label className={`block text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              Address
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className={`w-full px-4 py-3 rounded-xl border text-sm transition-colors ${
                  theme === 'dark'
                    ? 'bg-black/20 border-white/10 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none'
                    : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-primary focus:ring-1 focus:ring-primary outline-none'
                }`}
                placeholder="Enter your full address"
                disabled={loading}
              />
            ) : (
              <p className={`text-sm font-medium ${(user.userData?.address || user.address) ? '' : theme === 'dark' ? 'text-gray-500 italic' : 'text-gray-400 italic'}`}>
                {user.userData?.address || user.address || 'Not specified'}
              </p>
            )}
          </div>

          {/* Bio */}
          <div className="space-y-1 md:col-span-2">
            <label className={`block text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              Bio
            </label>
            {isEditing ? (
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                rows={4}
                className={`w-full px-4 py-3 rounded-xl border text-sm transition-colors resize-none ${
                  theme === 'dark'
                    ? 'bg-black/20 border-white/10 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none'
                    : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-primary focus:ring-1 focus:ring-primary outline-none'
                }`}
                placeholder="Tell us a bit about yourself..."
                disabled={loading}
              />
            ) : (
              <p className={`text-sm leading-relaxed ${(user.userData?.bio || user.bio) ? '' : theme === 'dark' ? 'text-gray-500 italic' : 'text-gray-400 italic'}`}>
                {user.userData?.bio || user.bio || 'No bio provided. Click Edit Profile to add one.'}
              </p>
            )}
          </div>
        </div>

        {/* AI Stats Section */}
        {!isEditing && (
          <div className="pt-6 border-t border-gray-100 dark:border-white/5">
            <h3 className="text-lg font-bold mb-4">AI Usage Statistics</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Queries</p>
                <p className="text-xl font-black text-primary">{(user.userData?.stats?.totalQueries || user.stats?.totalQueries || 0).toLocaleString()}</p>
              </div>
              <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Tokens</p>
                <p className="text-xl font-black">{(user.userData?.stats?.totalTokensUsed || user.stats?.totalTokensUsed || 0).toLocaleString()}</p>
              </div>
              <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Avg Latency</p>
                <p className="text-xl font-black">{(user.userData?.stats?.avgLatencyMs || user.stats?.avgLatencyMs || 0).toFixed(0)}ms</p>
              </div>
              <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Errors</p>
                <p className={`text-xl font-black ${(user.userData?.stats?.errorRate || user.stats?.errorRate) ? 'text-red-500' : 'text-green-500'}`}>
                  {user.userData?.stats?.errorRate || user.stats?.errorRate || 0}
                </p>
              </div>
              <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Est Cost</p>
                <p className="text-xl font-black">${(user.userData?.stats?.totalCostEstimate || user.stats?.totalCostEstimate || 0).toFixed(4)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons (Edit Mode Only) */}

        {isEditing && (
          <div className={`flex items-center justify-between gap-3 pt-6 border-t ${theme === 'dark' ? 'border-white/5' : 'border-gray-100'}`}>
            <button
              onClick={() => setShowDeleteModal(true)}
              disabled={loading || isDeleting}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all active:scale-95 disabled:opacity-50"
            >
              <BsTrashFill /> Delete Account
            </button>
            <div className="flex gap-3">
              <button
                onClick={() => setIsEditing(false)}
                disabled={loading || isDeleting}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 ${
                  theme === 'dark' ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={loading || isDeleting || !formData.fullName.trim()}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-primary hover:bg-primary-dark text-white transition-all active:scale-95 disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                ) : (
                  <BsCheckCircleFill />
                )}
                Save Changes
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteAccount}
        title="Delete Account"
        message="Are you sure you want to completely delete your account? This action cannot be undone and you will lose access to all your data immediately."
        confirmText="Delete My Account"
        confirmVariant="danger"
      />
    </div>
  );
}
