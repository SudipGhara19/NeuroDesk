import React from 'react';
import { BsXLg } from 'react-icons/bs';
import { UserRecord } from '@/lib/features/users/usersSlice';
import AnalyticsDashboard from './analytics/AnalyticsDashboard';

interface AnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserRecord | null;
  theme: string;
}

export default function AnalyticsModal({ isOpen, onClose, user, theme }: AnalyticsModalProps) {
  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className={`relative w-[90vw] max-w-6xl h-[90vh] flex flex-col rounded-3xl shadow-2xl overflow-hidden ${
        theme === 'dark' ? 'bg-[#0a0a0a] border border-white/10' : 'bg-white border border-gray-200'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b shrink-0 ${
          theme === 'dark' ? 'border-white/10' : 'border-gray-100'
        }`}>
          <div>
            <h2 className={`text-2xl font-black ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Analytics Dashboard
            </h2>
            <p className={`text-sm mt-1 font-bold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              Viewing stats for <span className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>{user.fullName}</span>
            </p>
          </div>
          <button 
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors ${
              theme === 'dark' ? 'hover:bg-white/10 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'
            }`}
          >
            <BsXLg size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <AnalyticsDashboard user={user} theme={theme} />
        </div>
      </div>
    </div>
  );
}
