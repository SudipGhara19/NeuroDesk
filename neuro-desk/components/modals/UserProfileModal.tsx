import React from 'react';
import { 
  BsXLg, BsEnvelopeFill, BsShieldLockFill, BsCalendarCheck, 
  BsRobot, BsTelephoneFill, BsGeoAltFill, BsBuilding, BsClockHistory
} from 'react-icons/bs';
import { UserRecord } from '@/lib/features/users/usersSlice';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserRecord | null;
  theme: string;
}

export default function UserProfileModal({ isOpen, onClose, user, theme }: UserProfileModalProps) {
  if (!isOpen || !user) return null;

  const isOnline = user.presence?.isOnline || false;

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
          <div className="flex gap-4 items-center">
            <h2 className={`text-2xl font-black ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              User Profile
            </h2>
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
          
          {/* Top Section: Avatar & Basic Info */}
          <div className={`flex flex-col md:flex-row items-center md:items-start gap-6 pb-8 mb-8 border-b ${
            theme === 'dark' ? 'border-white/10' : 'border-gray-100'
          }`}>
            <div className="relative shrink-0">
              <div className="w-28 h-28 shrink-0 rounded-full bg-linear-to-tr from-primary to-primary-dark flex items-center justify-center text-white text-4xl font-black shadow-lg">
                {user.fullName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
              </div>
              <span className={`absolute bottom-1 right-1 w-5 h-5 rounded-full border-4 ${
                theme === 'dark' ? 'border-[#0a0a0a]' : 'border-white'
              } ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`} title={isOnline ? 'Online' : 'Offline'} />
            </div>
            
            <div className={`flex-1 text-center md:text-left ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              <h3 className="text-3xl font-black mb-2">{user.fullName}</h3>
              {user.bio && (
                  <p className={`text-sm mb-4 max-w-2xl mx-auto md:mx-0 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    {user.bio}
                  </p>
              )}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-2">
                <Badge label={user.role} color={
                  user.role === 'Admin' ? 'purple' : user.role === 'Manager' ? 'blue' : 'gray'
                } />
                <Badge label={user.isActive ? 'Active' : 'Blocked'} color={user.isActive ? 'green' : 'red'} />
                {user.isAiRestricted && <Badge label="AI Restricted" color="yellow" />}
                {user.department && <Badge label={user.department} color="indigo" />}
              </div>
            </div>
            
            {/* Quick Stats Sidebar-ish */}
            {user.stats && (
              <div className={`hidden lg:flex flex-col gap-2 p-4 rounded-xl border shrink-0 min-w-48 ${
                theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-100'
              }`}>
                <div className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Quick Stats</div>
                <QuickStat label="Active Queries" value={user.stats.totalQueries?.toLocaleString() || '0'} theme={theme} />
                <QuickStat label="Docs Uploaded" value={user.stats.docsUploaded?.toLocaleString() || '0'} theme={theme} />
                <QuickStat label="Total Cost" value={`$${(user.stats.totalCostEstimate || 0).toFixed(2)}`} theme={theme} />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <InfoCard icon={<BsEnvelopeFill />} label="Email Address" value={user.email} theme={theme} />
            {user.phone && <InfoCard icon={<BsTelephoneFill />} label="Phone Number" value={user.phone} theme={theme} />}
            {user.address && <InfoCard icon={<BsGeoAltFill />} label="Location" value={user.address} theme={theme} />}
            {user.department && <InfoCard icon={<BsBuilding />} label="Department" value={user.department} theme={theme} />}
            <InfoCard icon={<BsShieldLockFill />} label="Role" value={user.role} theme={theme} />
            <InfoCard icon={<BsCalendarCheck />} label="Member Since" value={new Date(user.createdAt).toLocaleDateString()} theme={theme} />
            <InfoCard icon={<BsRobot />} label="AI Assistant" value={user.isAiRestricted ? 'Restricted' : 'Allowed'} theme={theme} />
            <InfoCard icon={<BsClockHistory />} label="Last Seen" value={user.presence?.lastSeen ? new Date(user.presence.lastSeen).toLocaleString() : 'Never'} theme={theme} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Badge({ label, color }: { label: string; color: 'green' | 'red' | 'yellow' | 'blue' | 'purple' | 'gray' | 'indigo' }) {
  const colors = {
    green: 'bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-400',
    red: 'bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400',
    yellow: 'bg-yellow-500/10 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-400',
    blue: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300',
    purple: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300',
    gray: 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300',
    indigo: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300',
  };
  return (
    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${colors[color]}`}>
      {label}
    </span>
  );
}

function QuickStat({ label, value, theme }: { label: string; value: string; theme: string }) {
  return (
    <div className={`flex justify-between items-center text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
      <span>{label}:</span>
      <span className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{value}</span>
    </div>
  );
}

function InfoCard({ icon, label, value, theme }: { icon: React.ReactNode; label: string; value: string; theme: string }) {
  return (
    <div className={`p-4 rounded-2xl border flex items-start gap-4 transition-colors ${
      theme === 'dark' ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-gray-50 border-gray-100 hover:bg-white'
    }`}>
      <div className={`p-2.5 rounded-xl shrink-0 ${
        theme === 'dark' ? 'bg-white/10 text-gray-300' : 'bg-white shadow-sm text-gray-600 border border-gray-100'
      }`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className={`text-xs font-bold mb-0.5 uppercase tracking-wider ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
          {label}
        </p>
        <p className={`text-sm font-medium truncate ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}>
          {value}
        </p>
      </div>
    </div>
  );
}
