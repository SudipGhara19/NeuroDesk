'use client';

import { useSelector } from 'react-redux';
import { selectCurrentUser, selectIsAuthenticated } from '@/lib/features/auth/authSlice';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';
import Sidebar from '@/components/Sidebar';
import { useTheme } from '@/components/providers/ThemeProvider';

// Role Dashboards
import AdminDashboard from '@/components/Admin/AdminDashboard';
import ManagerDashboard from '@/components/Manager/ManagerDashboard';
import UserDashboard from '@/components/User/UserDashboard';
import UserManagement from '@/components/shared/UserManagement';
import UserProfile from '@/components/User/UserProfile';
import Chat from '@/components/shared/Chat';
import KnowledgeBase from '@/components/Admin/KnowledgeBase';
import AiChat from '@/components/shared/AiChat';
import SystemAnalytics from '@/components/Admin/SystemAnalytics';

function DashboardContent() {
  const user = useSelector(selectCurrentUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const { theme } = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "dashboard";

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth?tab=login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated || !user) {
    return null;
  }

  const role = user.role || 'User';

  const renderContent = () => {
    // Shared routed tabs (available to multiple roles)
    if (activeTab === 'analytics' && (role === 'Admin' || role === 'Manager')) {
      return <SystemAnalytics />;
    }

    if (activeTab === 'users' && (role === 'Admin' || role === 'Manager')) {
      return <UserManagement viewMode={role === 'Admin' ? 'admin' : 'manager'} />;
    }

    if (activeTab === 'profile') {
      return <UserProfile />;
    }

    if (activeTab === 'team-chat') {
      return <Chat />;
    }

    if (activeTab === 'knowledge') {
      return <KnowledgeBase />;
    }

    if (activeTab === 'ai-chat') {
      return <AiChat />;
    }

    // If not on 'dashboard' tab, show a generic "Under Construction" for other tabs
    if (activeTab !== 'dashboard') {
      return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center">
          <div className="w-20 h-20 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center mb-6">
             <span className="text-4xl text-gray-300 dark:text-gray-600">⚙️</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white uppercase tracking-tight">Access Denied or Not Ready</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-sm">
            The <span className="text-black dark:text-white font-bold">&quot;{activeTab}&quot;</span> section is currently under development for the <span className="font-bold">{role}</span> dashboard.
          </p>
        </div>
      );
    }

    switch (role) {
      case 'Admin':
        return <AdminDashboard />;
      case 'Manager':
        return <ManagerDashboard />;
      case 'User':
      default:
        return <UserDashboard />;
    }
  };

  return (
    <div className={`flex min-h-screen transition-colors duration-300 ${
      theme === 'dark' ? 'bg-[#0a0a0a] text-gray-100' : 'bg-white text-gray-900'
    }`}>
      <Sidebar />
      
      <main className="flex-1 w-full lg:ml-[280px]">
        {/* Main Header / Breadcrumb */}
        <header className={`h-16 lg:h-20 flex items-center px-4 lg:px-10 backdrop-blur-md sticky top-0 z-40 border-b transition-colors ${
          theme === 'dark' ? 'bg-[#0a0a0a]/80 border-white/5' : 'bg-white/80 border-gray-100'
        }`}>
           <div className="flex items-center gap-3">
             <span className="w-1.5 h-6 bg-primary rounded-full shadow-sm shadow-primary/20" />
             <h1 className={`text-xl font-bold tracking-tight capitalize ${
               theme === 'dark' ? 'text-white' : 'text-gray-900'
             }`}>
               {activeTab.replace('-', ' ')}
             </h1>
           </div>
           
           <div className="ml-auto hidden sm:flex items-center gap-4">
              <div className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border transition-colors ${
                theme === 'dark' ? 'bg-white/5 text-gray-400 border-white/10' : 'bg-gray-100 text-gray-500 border-gray-200'
              }`}>
                LATEST UPDATES: MAR 01
              </div>
           </div>
        </header>

        {/* Dynamic Content Area */}
        {(activeTab === 'team-chat' || activeTab === 'ai-chat') ? (
          <div className="h-[calc(100vh-5rem)] overflow-hidden">
            {renderContent()}
          </div>
        ) : (
          <div className="p-3 sm:p-5 lg:p-8 mb-20 lg:mt-0">
            <div className="max-w-7xl mx-auto">
              {renderContent()}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function Home() {
  const { theme } = useTheme();
  return (
    <Suspense fallback={
      <div className={`h-screen flex items-center justify-center font-black tracking-widest animate-pulse transition-colors duration-300 ${
        theme === 'dark' ? 'bg-[#0a0a0a] text-white' : 'bg-white text-black'
      }`}>
        SYNCHRONIZING DESK...
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
