import React from 'react';
import { BsShieldFill } from 'react-icons/bs';
import { Message } from './types';

export const getSenderId = (s: Message['senderId']) =>
  typeof s === 'object' ? s._id : s;

export const getSenderName = (s: Message['senderId']) =>
  typeof s === 'object' ? s.fullName : null;

export const getInitial = (name: string) => name.trim().charAt(0).toUpperCase();

export const avatarColors = [
  'from-violet-500 to-purple-700',
  'from-sky-400 to-blue-600',
  'from-emerald-400 to-teal-600',
  'from-rose-400 to-pink-600',
  'from-amber-400 to-orange-600',
];

export const getColor = (id: string) =>
  avatarColors[id.charCodeAt(id.length - 1) % avatarColors.length];

export const RoleBadge = ({ role }: { role: string }) => {
  if (role === 'User') return null;
  const isAdmin = role === 'Admin';
  return (
    <span className={`inline-flex items-center gap-0.5 text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full ${
      isAdmin
        ? 'bg-rose-500/15 text-rose-500'
        : 'bg-blue-500/15 text-blue-400'
    }`}>
      <BsShieldFill className="text-[8px]" />
      {role}
    </span>
  );
};

export const Avatar = ({ name, id, size = 'md' }: { name: string; id: string; size?: 'sm' | 'md' }) => {
  const s = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm' };
  return (
    <div className={`${s[size]} rounded-full bg-linear-to-br ${getColor(id || '0')} flex items-center justify-center font-bold text-white shrink-0 shadow-md`}>
      {getInitial(name || '?')}
    </div>
  );
};

export const OnlineDot = ({ online, dk, borderColor }: { online: boolean; dk: boolean; borderColor: string }) => (
  <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 ${borderColor} ${
    online ? 'bg-green-500' : dk ? 'bg-gray-600' : 'bg-gray-300'
  }`} />
);
