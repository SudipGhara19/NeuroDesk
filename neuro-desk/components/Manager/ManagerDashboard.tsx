'use client';

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from '../providers/ThemeProvider';
import { fetchUsers, selectAllUsers, selectUsersLoading, selectUsersError } from '@/lib/features/users/usersSlice';
import { selectCurrentUser } from '@/lib/features/auth/authSlice';
import { AppDispatch } from '@/lib/store';
import Link from 'next/link';
import AggregateCharts from '../shared/analytics/AggregateCharts';
import { useSocket } from '@/components/providers/SocketProvider';

function StatItem({ label, value, color, loading, theme }: {
  label: string; value: number; color: string; loading: boolean; theme: string;
}) {
  return (
    <div className="flex flex-col items-center text-center">
      {loading ? (
        <>
          <div className={`h-5 w-8 rounded-md animate-pulse mb-1 ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-200'}`} />
          <div className={`h-2.5 w-14 rounded animate-pulse ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-200'}`} />
        </>
      ) : (
        <>
          <span className={`text-lg font-black leading-none ${color}`}>{value}</span>
          <span className={`text-[10px] font-semibold uppercase tracking-widest mt-0.5 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>{label}</span>
        </>
      )}
    </div>
  );
}

function SkeletonRow({ theme }: { theme: string }) {
  return (
    <tr className={`border-b animate-pulse ${theme === 'dark' ? 'border-white/5' : 'border-gray-100'}`}>
      {[40, 28, 20, 16].map((w, i) => (
        <td key={i} className="px-4 py-3">
          <div className={`h-3 rounded ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-200'}`} style={{ width: `${w * 2}px` }} />
        </td>
      ))}
    </tr>
  );
}

const roleBadge: Record<string, string> = {
  Manager: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300',
  User: 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300',
};

export default function ManagerDashboard() {
  const { theme } = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  const allUsers = useSelector(selectAllUsers);
  const loading = useSelector(selectUsersLoading);
  const error = useSelector(selectUsersError);
  const currentUser = useSelector(selectCurrentUser);
  const { onlineIds } = useSocket();

  useEffect(() => {
    if (allUsers.length === 0) {
      dispatch(fetchUsers());
    }
  }, [dispatch, allUsers.length]);

  // Managers see their own team: non-Admin users
  const teamMembers = allUsers.filter((u) => u.role !== 'Admin');
  const activeMembers = teamMembers.filter((u) => u.isActive);
  const inactiveMembers = teamMembers.filter((u) => !u.isActive);
  const totalManagers = teamMembers.filter((u) => u.role === 'Manager').length;
  const totalUsers = teamMembers.filter((u) => u.role === 'User').length;
  const utilization = teamMembers.length > 0 ? Math.round((activeMembers.length / teamMembers.length) * 100) : 0;

  const stats = [
    { label: 'Team Size', value: teamMembers.length, color: 'text-primary-darkest dark:text-primary', bg: 'bg-primary/5 border-primary/10 dark:bg-primary/10 dark:border-primary/20' },
    { label: 'Active Members', value: activeMembers.length, color: 'text-green-700 dark:text-green-300', bg: 'bg-green-50 border-green-100 dark:bg-green-500/10 dark:border-green-500/20' },
    { label: 'Inactive', value: inactiveMembers.length, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 border-red-100 dark:bg-red-500/10 dark:border-red-500/20' },
    { label: 'Managers', value: totalManagers, color: 'text-blue-700 dark:text-blue-300', bg: 'bg-blue-50 border-blue-100 dark:bg-blue-500/10 dark:border-blue-500/20' },
    { label: 'Team Members', value: totalUsers, color: 'text-primary-darker dark:text-primary-dark', bg: 'bg-primary-dark/5 border-primary-dark/10 dark:bg-primary-dark/10 dark:border-primary-dark/20' },
  ];

  return (
    <div className={`rounded-2xl border transition-colors ${
      theme === 'dark' ? 'bg-white/5 border-white/5 text-white' : 'bg-white border-gray-100 text-gray-800'
    }`}>
      {/* Header */}
      <div className={`p-4 sm:p-6 border-b flex items-center justify-between ${theme === 'dark' ? 'border-white/5' : 'border-gray-100'}`}>
        <div>
          <h2 className="text-2xl font-bold">Management Hub</h2>
          <p className={`text-sm mt-0.5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            Track team performance and member activity
          </p>
        </div>
        {loading && (
          <div className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full ${
            theme === 'dark' ? 'bg-white/10 text-gray-300' : 'bg-gray-100 text-gray-500'
          }`}>
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Syncing...
          </div>
        )}
      </div>

      <div className="p-4 sm:p-6 space-y-6">
        {/* Compact Metrics Strip — 2 cols on mobile, full row on md+ */}
        <div className={`grid grid-cols-2 md:hidden gap-px rounded-xl border overflow-hidden ${
          theme === 'dark' ? 'bg-white/10 border-white/5' : 'bg-gray-200 border-gray-100'
        }`}>
          {stats.map((stat) => (
            <div key={stat.label + '-m'} className={`py-3 flex justify-center ${
              theme === 'dark' ? 'bg-[#0a0a0a]' : 'bg-white'
            }`}>
              <StatItem label={stat.label} value={stat.value} color={stat.color} loading={loading} theme={theme} />
            </div>
          ))}
        </div>
        <div className={`hidden md:flex items-center rounded-xl border overflow-hidden ${
          theme === 'dark' ? 'bg-white/5 border-white/5 divide-white/10' : 'bg-gray-50 border-gray-100 divide-gray-200'
        } divide-x`}>
          {stats.map((stat) => (
            <div key={stat.label} className="flex-1 py-3 flex justify-center">
              <StatItem label={stat.label} value={stat.value} color={stat.color} loading={loading} theme={theme} />
            </div>
          ))}
        </div>

        {/* Capacity Bar */}
        {/* <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className={`text-sm font-black uppercase tracking-widest ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              Team Capacity
            </h3>
            {!loading && (
              <span className={`text-sm font-bold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                {utilization}% Utilization
              </span>
            )}
          </div>
          <div className={`h-3 w-full rounded-full overflow-hidden ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-100'}`}>
            {loading ? (
              <div className="h-full w-3/4 bg-gray-300 dark:bg-white/10 animate-pulse rounded-full" />
            ) : (
              <div
                className="h-full rounded-full bg-linear-to-r from-primary to-primary-dark transition-all duration-700"
                style={{ width: `${utilization}%` }}
              />
            )}
          </div>
          <p className={`text-xs mt-1.5 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
            {activeMembers.length} active out of {teamMembers.length} total members
          </p>
        </div> */}

        {/* Aggregate Network Charts for the Team */}
        <AggregateCharts users={teamMembers} theme={theme} />

        {/* Error state */}
        {error && (
          <div className={`p-4 rounded-xl border text-sm font-medium ${
            theme === 'dark' ? 'bg-red-500/10 border-red-500/20 text-red-300' : 'bg-red-50 border-red-200 text-red-600'
          }`}>
            ⚠️ Failed to load team data: {error}
          </div>
        )}

        {/* Team Members Table */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-sm font-black uppercase tracking-widest ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              Team Members
            </h3>
            <Link
              href="/?tab=users"
              className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-all active:scale-95 ${
                theme === 'dark' ? 'bg-white/5 hover:bg-white/10 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
              }`}
            >
              Manage Team →
            </Link>
          </div>
          <div className={`rounded-xl border overflow-hidden ${theme === 'dark' ? 'border-white/5' : 'border-gray-100'}`}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className={`text-xs font-black uppercase tracking-widest ${
                    theme === 'dark' ? 'bg-white/5 text-gray-400' : 'bg-gray-50 text-gray-500'
                  }`}>
                    <th className="text-left px-4 py-3">Name</th>
                    <th className="text-left px-4 py-3">Email</th>
                    <th className="text-left px-4 py-3">Role</th>
                    <th className="text-left px-4 py-3">Online</th>
                    <th className="text-left px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading
                    ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} theme={theme} />)
                    : teamMembers
                        .filter(member => member._id !== currentUser?._id)
                        .slice(0, 5)
                        .map((member) => (
                        <tr
                          key={member._id}
                          className={`border-b last:border-0 transition-colors ${
                            theme === 'dark'
                              ? 'border-white/5 hover:bg-white/5'
                              : 'border-gray-100 hover:bg-gray-50'
                          }`}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{member.fullName}</span>
                              {currentUser?._id === member._id && (
                                <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary">(You)</span>
                              )}
                            </div>
                          </td>
                          <td className={`px-4 py-3 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                            {member.email}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider ${roleBadge[member.role] ?? roleBadge.User}`}>
                              {member.role}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {onlineIds.has(member._id) ? (
                              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-600 dark:text-green-400">
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                                </span>
                                Online
                              </span>
                            ) : (
                              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                                <span className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600" />
                                Offline
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                              member.isActive
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-red-500 dark:text-red-400'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${member.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                              {member.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                        </tr>
                      ))}
                </tbody>
              </table>
              {!loading && teamMembers.length === 0 && !error && (
                <div className={`p-8 text-center text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                  No team members found.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
