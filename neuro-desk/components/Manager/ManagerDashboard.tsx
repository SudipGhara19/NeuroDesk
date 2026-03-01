'use client';

import { useTheme } from '../providers/ThemeProvider';

export default function ManagerDashboard() {
  const { theme } = useTheme();

  return (
    <div className={`p-6 rounded-2xl shadow-sm border transition-colors ${
      theme === 'dark' ? 'bg-white/5 border-white/5 text-white' : 'bg-white border-gray-100 text-gray-800'
    }`}>
      <h2 className="text-2xl font-bold mb-4">Management Hub</h2>
      <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Track team performance, project timelines, and resource allocation.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div className={`p-6 rounded-xl border transition-colors ${
          theme === 'dark' ? 'bg-primary/10 border-primary/20' : 'bg-primary/5 border-primary/10'
        }`}>
          <h3 className={`font-bold mb-2 transition-colors ${theme === 'dark' ? 'text-primary' : 'text-primary-darkest'}`}>Active Projects</h3>
          <ul className="space-y-2">
            <li className={`flex justify-between text-sm transition-colors ${theme === 'dark' ? 'text-primary/80' : 'text-primary-darker'}`}>
              <span>Neuro-Core API</span>
              <span className="font-bold">85%</span>
            </li>
            <li className={`flex justify-between text-sm transition-colors ${theme === 'dark' ? 'text-primary/80' : 'text-primary-darker'}`}>
              <span>Frontend Refactor</span>
              <span className="font-bold">40%</span>
            </li>
          </ul>
        </div>
        <div className={`p-6 rounded-xl border transition-colors ${
          theme === 'dark' ? 'bg-primary-dark/10 border-primary-dark/20' : 'bg-primary-dark/5 border-primary-dark/10'
        }`}>
          <h3 className={`font-bold mb-2 transition-colors ${theme === 'dark' ? 'text-primary-dark' : 'text-primary-darkest'}`}>Team Capacity</h3>
          <div className={`h-4 w-full rounded-full overflow-hidden mt-4 transition-colors ${
            theme === 'dark' ? 'bg-primary-dark/30' : 'bg-primary-dark/20'
          }`}>
            <div className="h-full bg-primary-dark w-3/4" />
          </div>
          <p className={`text-xs mt-2 font-medium transition-colors ${
            theme === 'dark' ? 'text-primary-dark/70' : 'text-primary-darker'
          }`}>75% Utilization across 12 members</p>
        </div>
      </div>
    </div>
  );
}
