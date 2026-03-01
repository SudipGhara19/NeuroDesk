import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useTheme } from '@/components/providers/ThemeProvider';
import { createManager } from '@/lib/features/users/usersSlice';
import { AppDispatch } from '@/lib/store';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateManagerModal({ isOpen, onClose }: Props) {
  const { theme } = useTheme();
  const dispatch = useDispatch<AppDispatch>();

  const [createManagerForm, setCreateManagerForm] = useState({ fullName: '', email: '', password: '' });
  const [isCreatingManager, setIsCreatingManager] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCreateManager = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setIsCreatingManager(true);
    try {
      await dispatch(createManager(createManagerForm)).unwrap();
      setCreateManagerForm({ fullName: '', email: '', password: '' });
      onClose();
    } catch (err: unknown) {
      setActionError(typeof err === 'string' ? err : 'Failed to create manager.');
    } finally {
      setIsCreatingManager(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`w-full max-w-md rounded-2xl shadow-2xl p-6 ${
        theme === 'dark' ? 'bg-[#1a1a1a] border border-white/10' : 'bg-white border border-gray-100'
      } animate-in zoom-in-95 duration-200`}>
        
        <h2 className={`text-xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          Create New Manager
        </h2>

        {actionError && (
          <div className={`p-3 rounded-xl border text-sm font-medium mb-4 ${
            theme === 'dark' ? 'bg-red-500/10 border-red-500/20 text-red-300' : 'bg-red-50 border-red-200 text-red-600'
          }`}>
            ⚠️ {actionError}
          </div>
        )}

        <form onSubmit={handleCreateManager} className="space-y-4">
          <div>
            <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Full Name</label>
            <input
              type="text"
              required
              value={createManagerForm.fullName}
              onChange={(e) => setCreateManagerForm({...createManagerForm, fullName: e.target.value})}
              className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-colors ${
                theme === 'dark' ? 'bg-black/20 border-white/10 text-white focus:border-primary focus:ring-1 outline-none' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-primary focus:ring-1 outline-none'
              }`}
              placeholder="Manager's Full Name"
            />
          </div>

          <div>
            <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Email Address</label>
            <input
              type="email"
              required
              value={createManagerForm.email}
              onChange={(e) => setCreateManagerForm({...createManagerForm, email: e.target.value})}
              className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-colors ${
                theme === 'dark' ? 'bg-black/20 border-white/10 text-white focus:border-primary focus:ring-1 outline-none' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-primary focus:ring-1 outline-none'
              }`}
              placeholder="manager@neurodesk.com"
            />
          </div>

          <div>
            <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Password</label>
            <input
              type="password"
              required
              value={createManagerForm.password}
              onChange={(e) => setCreateManagerForm({...createManagerForm, password: e.target.value})}
              className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-colors ${
                theme === 'dark' ? 'bg-black/20 border-white/10 text-white focus:border-primary focus:ring-1 outline-none' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-primary focus:ring-1 outline-none'
              }`}
              placeholder="Secure password"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isCreatingManager}
              className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                theme === 'dark' ? 'bg-white/5 hover:bg-white/10 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreatingManager || !createManagerForm.fullName || !createManagerForm.email || !createManagerForm.password}
              className="flex-1 inline-flex justify-center items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-dark text-white text-sm font-bold rounded-xl transition-all disabled:opacity-50"
            >
              {isCreatingManager ? (
                 <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              ) : "Create Manager"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
