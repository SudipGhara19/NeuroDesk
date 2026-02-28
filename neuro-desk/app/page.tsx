'use client';

import { useSelector, useDispatch } from 'react-redux';
import { selectCurrentUser, logout } from '@/lib/features/auth/authSlice';
import { useRouter } from 'next/navigation';

export default function Home() {
  const user = useSelector(selectCurrentUser);
  const dispatch = useDispatch();
  const router = useRouter();

  const handleLogout = () => {
    dispatch(logout());
    router.push('/auth?tab=login');
  };

  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black p-4 text-center">
      {user ? (
        <div className="space-y-6">
          <h1 className="text-4xl font-bold text-gray-900 leading-tight">
            Welcome back, <span className="text-blue-600">{user.fullName}</span>!
          </h1>
          <p className="text-lg text-gray-600 max-w-md mx-auto">
            You are successfully authenticated. From here you can manage your desk and collaborate.
          </p>
          <div className="pt-4">
            <button
              onClick={handleLogout}
              className="px-8 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all shadow-lg hover:shadow-red-200 active:scale-95"
            >
              Sign Out Securely
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <h1 className="text-4xl font-bold text-gray-900 leading-tight">
            Unlock Neuro Desk
          </h1>
          <p className="text-lg text-gray-600 max-w-md mx-auto">
            Please sign in to access your workspace and powerful neuro-tools.
          </p>
          <div className="pt-4">
            <button
              onClick={() => router.push('/auth?tab=login')}
              className="px-8 py-3 bg-black text-white rounded-xl font-semibold hover:bg-gray-800 transition-all shadow-lg hover:shadow-gray-200 active:scale-95"
            >
              Get Started
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
