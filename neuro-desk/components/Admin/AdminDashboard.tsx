'use client';

import { useTheme } from '../providers/ThemeProvider';

export default function AdminDashboard() {
  const { theme } = useTheme();

  return (
    <div className={`p-6 rounded-2xl shadow-sm border transition-colors ${
      theme === 'dark' ? 'bg-white/5 border-white/5 text-white' : 'bg-white border-gray-100 text-gray-800'
    }`}>
      <h2 className="text-2xl font-bold mb-4">Admin Console</h2>
      <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Overview of system health, user activity, and critical metrics.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className={`p-4 rounded-xl border transition-colors ${
          theme === 'dark' ? 'bg-primary/10 border-primary/20' : 'bg-primary/5 border-primary/10'
        }`}>
          <p className="text-sm font-medium text-primary uppercase tracking-wider">Total Users</p>
          <p className={`text-3xl font-bold mt-1 transition-colors ${
            theme === 'dark' ? 'text-primary' : 'text-primary-darkest'
          }`}>1,284</p>
        </div>
        <div className={`p-4 rounded-xl border transition-colors ${
          theme === 'dark' ? 'bg-green-500/10 border-green-500/20' : 'bg-green-50'
        }`}>
          <p className={`text-sm font-medium uppercase tracking-wider transition-colors ${
            theme === 'dark' ? 'text-green-400' : 'text-green-600'
          }`}>Active Sessions</p>
          <p className={`text-3xl font-bold mt-1 transition-colors ${
            theme === 'dark' ? 'text-green-300' : 'text-green-900'
          }`}>42</p>
        </div>
        <div className={`p-4 rounded-xl border transition-colors ${
          theme === 'dark' ? 'bg-primary-dark/10 border-primary-dark/20' : 'bg-primary-dark/5 border-primary-dark/10'
        }`}>
          <p className="text-sm font-medium text-primary-dark uppercase tracking-wider">System Status</p>
          <p className={`text-3xl font-bold mt-1 transition-colors ${
            theme === 'dark' ? 'text-primary-dark' : 'text-primary-darkest'
          }`}>Optimal</p>
        </div>
      </div>
    </div>
  );
}
