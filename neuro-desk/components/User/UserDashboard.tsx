'use client';

import { useTheme } from '../providers/ThemeProvider';

export default function UserDashboard() {
  const { theme } = useTheme();

  return (
    <div className={`p-6 rounded-2xl shadow-sm border transition-colors ${
      theme === 'dark' ? 'bg-white/5 border-white/5 text-white' : 'bg-white border-gray-100 text-gray-800'
    }`}>
      <h2 className="text-2xl font-bold mb-4">My Workspace</h2>
      <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Access your tools, recent activity, and personal statistics.</p>
      
      <div className={`mt-8 p-8 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center transition-colors ${
        theme === 'dark' ? 'border-white/5' : 'border-gray-100'
      }`}>
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors ${
          theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'
        }`}>
          <svg className={`w-8 h-8 transition-colors ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        <h3 className={`text-lg font-bold transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>No recent activity</h3>
        <p className={`text-sm mt-1 transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Start by creating a new project or uploading a document.</p>
        <button className={`mt-6 px-6 py-2 rounded-lg font-medium transition-all ${
          theme === 'dark' ? 'bg-white text-black hover:bg-gray-200' : 'bg-black text-white hover:bg-gray-800'
        }`}>
          New Project
        </button>
      </div>
    </div>
  );
}
