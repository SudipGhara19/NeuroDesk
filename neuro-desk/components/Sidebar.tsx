'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '@/lib/features/auth/authSlice';
import { RootState } from '@/lib/store';
import logo from "../public/common/logo.png";
import logoWhite from "../public/common/logo-white.png";
import { User } from '@/lib/features/auth/authSlice';
import { useTheme } from '@/components/providers/ThemeProvider';

// Icons
import { 
  BsGrid1X2Fill, 
  BsPeopleFill, 
  BsBarChartFill, 
  BsGearFill,
  BsBriefcaseFill,
  BsLightningFill,
  BsPersonCircle,
  BsCheck2Square,
  BsXLg,
  BsList,
  BsBoxArrowRight,
  BsChatLeftTextFill,
  BsChatDotsFill,
  BsFolder2Open,
  BsSunFill,
  BsMoonStarsFill
} from "react-icons/bs";

interface SidebarItem {
  name: string;
  icon: React.ReactNode;
  tab: string;
}

const roleMenus: Record<string, SidebarItem[]> = {
  Admin: [
    { name: "Dashboard", icon: <BsGrid1X2Fill />, tab: "dashboard" },
    { name: "AI Assistant", icon: <BsChatLeftTextFill />, tab: "ai-chat" },
    { name: "Team Chat", icon: <BsChatDotsFill />, tab: "team-chat" },
    { name: "Knowledge Base", icon: <BsBriefcaseFill />, tab: "knowledge" },
    { name: "User Management", icon: <BsPeopleFill />, tab: "users" },
    { name: "System Analytics", icon: <BsBarChartFill />, tab: "analytics" },
    { name: "Settings", icon: <BsGearFill />, tab: "settings" },
  ],
  Manager: [
    { name: "Dashboard", icon: <BsGrid1X2Fill />, tab: "dashboard" },
    { name: "AI Assistant", icon: <BsChatLeftTextFill />, tab: "ai-chat" },
    { name: "Team Chat", icon: <BsChatDotsFill />, tab: "team-chat" },
    { name: "Knowledge Base", icon: <BsBriefcaseFill />, tab: "knowledge" },
    { name: "Document Manager", icon: <BsFolder2Open />, tab: "documents" },
    { name: "Team Stats", icon: <BsLightningFill />, tab: "stats" },
  ],
  User: [
    { name: "Dashboard", icon: <BsGrid1X2Fill />, tab: "dashboard" },
    { name: "AI Assistant", icon: <BsChatLeftTextFill />, tab: "ai-chat" },
    { name: "Team Chat", icon: <BsChatDotsFill />, tab: "team-chat" },
    { name: "Profile", icon: <BsPersonCircle />, tab: "profile" },
  ],
};

interface SidebarProps {
  user: User | null;
  activeTab: string;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  handleLogout: () => void;
  menuItems: SidebarItem[];
}

const SidebarContent = ({ user, activeTab, setIsOpen, handleLogout, menuItems }: SidebarProps) => {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <div className={`flex flex-col h-full py-8 px-6 transition-colors duration-300 ${
      theme === 'dark' ? 'bg-[#0a0a0a] text-white' : 'bg-white text-gray-900 border-r border-gray-100'
    }`}>
      {/* Brand */}
      <div className="flex items-center gap-3 mb-10 px-2">
        <div className="w-14 h-14 relative">
          <Image src={theme === 'dark' ? logoWhite : logo} alt="Neuro Desk" fill className="object-contain" />
        </div>
        <span className={`text-xl font-bold tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>NEURO DESK</span>
      </div>

      {/* User Quick Info */}
      <div className={`mb-10 px-2 py-4 rounded-2xl border transition-colors ${
        theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-100'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-primary-dark flex items-center justify-center font-bold border-2 border-white/20">
            {user?.fullName?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate">{user?.fullName}</p>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{user?.role}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        <p className="px-2 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4">Main Menu</p>
        {menuItems.map((item) => (
          <Link
            key={item.tab}
            href={`/?tab=${item.tab}`}
            onClick={() => setIsOpen(false)}
            className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 group ${
              activeTab === item.tab 
                ? theme === 'dark' ? "bg-white text-black font-bold shadow-lg shadow-white/5" : "bg-black text-white font-bold shadow-lg shadow-black/5" 
                : theme === 'dark' ? "text-gray-400 hover:text-white hover:bg-white/5" : "text-gray-500 hover:text-black hover:bg-gray-100"
            }`}
          >
            <span className={`text-xl transition-transform duration-300 ${activeTab === item.tab ? "scale-110" : "group-hover:scale-110"}`}>
              {item.icon}
            </span>
            <span className="text-sm">{item.name}</span>
            {activeTab === item.tab && (
              <div className={`ml-auto w-1.5 h-1.5 rounded-full ring-4 ${
                theme === 'dark' ? "bg-black ring-white" : "bg-white ring-black"
              }`} />
            )}
          </Link>
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className={`mt-auto space-y-2 pt-6 border-t ${theme === 'dark' ? 'border-white/5' : 'border-gray-100'}`}>
        {/* Theme Toggle */}
        <button 
          onClick={toggleTheme}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group mb-2 ${
            theme === 'dark' ? "text-gray-400 hover:text-white hover:bg-white/5" : "text-gray-500 hover:text-black hover:bg-gray-100"
          }`}
        >
          <div className="relative w-5 h-5">
            {theme === 'light' ? (
              <BsSunFill className="text-xl text-yellow-500 group-hover:scale-110 transition-transform" />
            ) : (
              <BsMoonStarsFill className="text-xl text-blue-400 group-hover:scale-110 transition-transform" />
            )}
          </div>
          <span className="text-sm font-bold">{theme === 'light' ? 'Light' : 'Dark'} Mode</span>
        </button>

        <button 
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group lg:mb-4 ${
            theme === 'dark' ? "text-gray-400 hover:text-red-400 hover:bg-red-500/10" : "text-gray-500 hover:text-red-500 hover:bg-red-50"
          }`}
        >
          <BsBoxArrowRight className="text-xl group-hover:translate-x-1 transition-transform" />
          <span className="text-sm font-bold">Sign Out</span>
        </button>
        
        {user?.role === "User" && <div className={`hidden lg:block p-4 rounded-2xl border transition-colors ${
          theme === 'dark' ? 'bg-gradient-to-br from-primary/20 to-primary-dark/20 border-white/5' : 'bg-primary/5 border-primary/10'
        }`}>
          <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">PRO FEATURES</p>
          <p className={`text-xs font-medium leading-relaxed ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Upgrade to unlock advanced AI insights and automation.</p>
        </div>}
      </div>
    </div>
  );
};

const Sidebar = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [isOpen, setIsOpen] = useState(false);
  const { theme } = useTheme();
  
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "dashboard";
  
  const dispatch = useDispatch();
  const router = useRouter();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setIsOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    router.push('/auth?tab=login');
  };

  const menuItems = user?.role ? roleMenus[user.role] || roleMenus.User : roleMenus.User;

  const sidebarProps: SidebarProps = {
    user,
    activeTab,
    isOpen,
    setIsOpen,
    handleLogout,
    menuItems
  };

  return (
    <>
      {/* Mobile Top Header */}
      <div className={`lg:hidden fixed top-0 left-0 w-full h-16 flex items-center justify-between px-6 z-[100] border-b transition-all duration-300 ${
        theme === 'dark' ? 'bg-[#0a0a0a] border-white/5' : 'bg-white border-gray-100'
      }`}>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 relative ">
              <Image src={theme === 'dark' ? logoWhite : logo} alt="Neuro Desk" fill className="object-contain" />
            </div>
            <span className={`text-lg font-bold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>NEURO DESK</span>
          </div>
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className={`p-2 rounded-lg active:scale-95 transition-all ${
              theme === 'dark' ? 'text-white bg-white/5' : 'text-gray-900 bg-gray-100'
            }`}
          >
            {isOpen ? <BsXLg size={22} /> : <BsList size={22} />}
          </button>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-[280px] h-screen fixed left-0 top-0 z-50 shadow-2xl">
        <SidebarContent {...sidebarProps} />
      </aside>

      {/* Mobile Sidebar Overlay */}
      <div 
        className={`lg:hidden fixed inset-0 z-[90] transition-all duration-500 ${
          isOpen ? "bg-black/60 backdrop-blur-sm opacity-100" : "bg-transparent opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsOpen(false)}
      />

      {/* Mobile Sidebar Drawer */}
      <aside 
        className={`lg:hidden fixed top-0 left-0 w-[300px] h-screen z-[100] transition-transform duration-500 ${
          isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        <SidebarContent {...sidebarProps} />
      </aside>
    </>
  );
};

export default Sidebar;
