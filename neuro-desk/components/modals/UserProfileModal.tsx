import React, { useState } from 'react';
import { 
  BsXLg, BsEnvelopeFill, BsShieldLockFill, BsCalendarCheck, 
  BsRobot, BsTelephoneFill, BsGeoAltFill, BsBuilding, BsGraphUp, 
  BsClockHistory, BsFileEarmarkTextFill, BsLightningFill, BsCashStack,
  BsLightbulbFill
} from 'react-icons/bs';
import { UserRecord } from '@/lib/features/users/usersSlice';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserRecord | null;
  theme: string;
}

export default function UserProfileModal({ isOpen, onClose, user, theme }: UserProfileModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics'>('overview');
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
            <div className={`flex overflow-hidden rounded-lg border ${theme === 'dark' ? 'border-white/10' : 'border-gray-200'}`}>
              <button 
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-1.5 text-sm font-bold transition-colors ${
                  activeTab === 'overview' 
                    ? (theme === 'dark' ? 'bg-primary text-white' : 'bg-primary text-white')
                    : (theme === 'dark' ? 'hover:bg-white/5 text-gray-400' : 'hover:bg-gray-50 text-gray-600')
                }`}
              >
                Overview
              </button>
              <button 
                onClick={() => setActiveTab('analytics')}
                className={`px-4 py-1.5 text-sm font-bold transition-colors border-l ${
                  theme === 'dark' ? 'border-white/10' : 'border-gray-200'
                } ${
                  activeTab === 'analytics' 
                    ? (theme === 'dark' ? 'bg-primary text-white' : 'bg-primary text-white')
                    : (theme === 'dark' ? 'hover:bg-white/5 text-gray-400' : 'hover:bg-gray-50 text-gray-600')
                }`}
              >
                Analytics
              </button>
            </div>
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
            {user.stats && activeTab === 'overview' && (
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

          {activeTab === 'overview' ? (
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
          ) : (
            <div className="flex flex-col gap-8">
              {/* Detailed AI Stats */}
              <div>
                <h4 className={`text-lg font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Usage Statistics</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                  <StatCard icon={<BsGraphUp />} label="Queries" value={user.stats?.totalQueries?.toString() || '0'} theme={theme} />
                  <StatCard icon={<BsFileEarmarkTextFill />} label="Documents" value={user.stats?.docsUploaded?.toString() || '0'} theme={theme} />
                  <StatCard icon={<BsLightningFill />} label="Tokens Used" value={user.stats?.totalTokensUsed?.toLocaleString() || '0'} theme={theme} />
                  <StatCard icon={<BsClockHistory />} label="Error Rate" value={`${(user.stats?.errorRate || 0)}%`} theme={theme} />
                  <StatCard icon={<BsCashStack />} label="Est. Cost" value={`$${(user.stats?.totalCostEstimate || 0).toFixed(2)}`} theme={theme} />
                </div>
              </div>

              {/* Insights & History */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Popular Searches */}
                <div className={`p-6 rounded-2xl border ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-100'}`}>
                  <h4 className={`text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                    <BsLightbulbFill className="text-yellow-500" /> Popular Patterns
                  </h4>
                  {user.analytics?.popularSearchPatterns && user.analytics.popularSearchPatterns.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {user.analytics.popularSearchPatterns.map((pattern, idx) => (
                        <span key={idx} className={`px-3 py-1.5 text-xs font-bold rounded-lg ${
                          theme === 'dark' ? 'bg-white/10 text-gray-300' : 'bg-white border text-gray-700'
                        }`}>
                          {pattern}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>No significant search patterns identified yet.</p>
                  )}
                </div>

                {/* Session History */}
                <div className={`p-6 rounded-2xl border ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-100'}`}>
                  <h4 className={`text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                    <BsClockHistory className="text-primary" /> Recent Sessions
                  </h4>
                  {user.analytics?.sessionHistory && user.analytics.sessionHistory.length > 0 ? (
                    <div className="flex flex-col gap-3">
                      {user.analytics.sessionHistory.slice(0, 4).map((session, idx) => (
                        <div key={idx} className={`flex items-center justify-between p-3 rounded-lg text-sm ${
                          theme === 'dark' ? 'bg-[#0a0a0a]' : 'bg-white border'
                        }`}>
                          <div className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                            {session.startTime ? new Date(session.startTime).toLocaleDateString() : 'Unknown Date'}
                          </div>
                          <div className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            {session.durationMs ? `${Math.round(session.durationMs / 60000)} mins` : '--'}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>No recent sessions recorded.</p>
                  )}
                </div>
              </div>
            </div>
          )}
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

function StatCard({ icon, label, value, theme }: { icon: React.ReactNode; label: string; value: string; theme: string }) {
  return (
    <div className={`flex flex-col items-center justify-center p-5 rounded-2xl border text-center ${
      theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-100'
    }`}>
      <div className={`p-3 rounded-full mb-3 ${
        theme === 'dark' ? 'bg-white/10 text-primary-light' : 'bg-white shadow-sm text-primary border border-gray-100'
      }`}>
        {icon}
      </div>
      <div className={`text-2xl font-black mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
        {value}
      </div>
      <div className={`text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
        {label}
      </div>
    </div>
  );
}
