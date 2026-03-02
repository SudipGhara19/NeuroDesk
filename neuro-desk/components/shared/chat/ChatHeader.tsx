import React from 'react';
import { BsChevronLeft, BsXLg, BsPeopleFill, BsGlobe2, BsLockFill } from 'react-icons/bs';
import { UserContact, ChatMode } from './types';
import { Avatar, OnlineDot } from './ui';

interface Props {
  dk: boolean;
  border: string;
  textPrimary: string;
  textMuted: string;
  setShowUsers: (v: React.SetStateAction<boolean>) => void;
  showUsers: boolean;
  chatMode: ChatMode;
  activeRecipient: UserContact | null;
  onlineIds: Set<string>;
}

export default function ChatHeader({
  dk, border, textPrimary, textMuted, setShowUsers, showUsers,
  chatMode, activeRecipient, onlineIds
}: Props) {
  return (
    <div className={`flex items-center gap-3 px-5 py-3.5 border-b shrink-0 ${dk ? 'bg-[#111111]' : 'bg-gray-50/80'} ${border}`}>
      {/* mobile back */}
      <button
        onClick={() => setShowUsers(true)}
        className={`md:hidden p-2 rounded-lg ${dk ? 'hover:bg-white/10' : 'hover:bg-gray-200'} transition-colors`}
      >
        <BsChevronLeft className={textPrimary} />
      </button>

      {/* desktop panel toggle */}
      <button
        onClick={() => setShowUsers((p) => !p)}
        title="Toggle contacts"
        className={`hidden md:flex p-2 rounded-lg transition-colors ${dk ? 'hover:bg-white/10' : 'hover:bg-gray-200'}`}
      >
        {showUsers
          ? <BsXLg className={`text-sm ${textMuted}`} />
          : <BsPeopleFill className={`text-sm ${textMuted}`} />}
      </button>

      {/* Avatar */}
      {chatMode === 'global' ? (
        <div className="w-10 h-10 rounded-full bg-linear-to-br from-primary to-primary-dark flex items-center justify-center shadow-md shadow-primary/30">
          <BsGlobe2 className="text-white" />
        </div>
      ) : activeRecipient ? (
        <div className="relative">
          <Avatar name={activeRecipient.fullName} id={activeRecipient._id} />
          <OnlineDot
            online={onlineIds.has(activeRecipient._id)}
            dk={dk}
            borderColor={dk ? 'border-[#111111]' : 'border-gray-50'} />
        </div>
      ) : null}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className={`font-bold text-base truncate leading-tight ${textPrimary}`}>
          {chatMode === 'global' ? 'General' : activeRecipient?.fullName || '—'}
        </h3>
        <p className={`text-xs ${textMuted}`}>
          {chatMode === 'global'
            ? 'Global · Everyone can see this'
            : `Private · ${activeRecipient?.fullName || ''}`}
        </p>
      </div>

      {/* Mode badge */}
      <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${
        chatMode === 'global'
          ? dk ? 'border-primary/40 bg-primary/10 text-primary' : 'border-primary/30 bg-primary/5 text-primary'
          : dk ? 'border-yellow-500/40 bg-yellow-500/10 text-yellow-400' : 'border-yellow-500/30 bg-yellow-50 text-yellow-600'
      }`}>
        {chatMode === 'global' ? <BsGlobe2 /> : <BsLockFill />}
        {chatMode === 'global' ? 'Global' : 'Private'}
      </div>
    </div>
  );
}
