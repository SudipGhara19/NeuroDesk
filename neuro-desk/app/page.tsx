'use client';

import { useSelector } from 'react-redux';
import { selectCurrentUser, selectIsAuthenticated } from '@/lib/features/auth/authSlice';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';
import Sidebar from '@/components/Sidebar';

// Role Dashboards
import AdminDashboard from '@/components/Admin/AdminDashboard';
import ManagerDashboard from '@/components/Manager/ManagerDashboard';
import UserDashboard from '@/components/User/UserDashboard';

function DashboardContent() {
  const user = useSelector(selectCurrentUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
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
    // If not on 'dashboard' tab, show a generic "Under Construction" for other tabs
    if (activeTab !== 'dashboard') {
      return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
             <span className="text-4xl text-gray-300">⚙️</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 uppercase tracking-tight">Access Denied or Not Ready</h2>
          <p className="text-gray-500 mt-2 max-w-sm">
            The <span className="text-black font-bold">&quot;{activeTab}&quot;</span> section is currently under development for the <span className="font-bold">{role}</span> dashboard.
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
    <div className="flex min-h-screen bg-[#FDFDFD]">
      <Sidebar />
      
      <main className="flex-1 w-full lg:ml-[280px]">
        {/* Main Header / Breadcrumb */}
        <header className="h-16 lg:h-20 flex items-center px-8 lg:px-12 bg-white/50 backdrop-blur-md sticky top-0 z-[40]">
           <div className="flex items-center gap-3">
             <span className="w-1.5 h-6 bg-black rounded-full" />
             <h1 className="text-xl font-bold text-gray-900 tracking-tight capitalize">
               {activeTab.replace('-', ' ')}
             </h1>
           </div>
           
           <div className="ml-auto hidden sm:flex items-center gap-4">
              <div className="px-4 py-1.5 bg-gray-100 rounded-full text-xs font-black text-gray-500 uppercase tracking-widest border border-gray-200">
                LATEST UPDATES: MAR 01
              </div>
           </div>
        </header>

        {/* Dynamic Content Area */}
        <div className="p-8 lg:p-12 mt-16 lg:mt-0">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center font-black tracking-widest animate-pulse">SYNCHRONIZING DESK...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
