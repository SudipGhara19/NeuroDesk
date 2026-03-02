import React from 'react';
import { BsGlobe2, BsLockFill, BsSearch, BsCircleFill, BsPeopleFill } from 'react-icons/bs';
import { UserContact, ChatMode } from './types';
import { Avatar, OnlineDot, RoleBadge } from './ui';

interface Props {
  showUsers: boolean;
  dk: boolean;
  sideBg: string;
  border: string;
  textPrimary: string;
  textMuted: string;
  onlineCount: number;
  chatMode: ChatMode;
  switchToGlobal: () => void;
  setChatMode: (m: ChatMode) => void;
  setShowUsers: (v: boolean) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filteredContacts: UserContact[];
  contacts: UserContact[];
  onlineIds: Set<string>;
  activeRecipient: UserContact | null;
  handleSelectUser: (contact: UserContact) => void;
  unreadPrivate: Record<string, number>;
}

export default function ChatSidebar({
  showUsers, dk, sideBg, border, textPrimary, textMuted, onlineCount,
  chatMode, switchToGlobal, setChatMode, setShowUsers,
  searchQuery, setSearchQuery, filteredContacts, contacts,
  onlineIds, activeRecipient, handleSelectUser, unreadPrivate
}: Props) {
  return (
    <div className={`${showUsers ? 'flex' : 'hidden'} md:flex flex-col w-full md:w-[290px] xl:w-[310px] shrink-0 border-r ${sideBg} ${border}`}>

      {/* Header */}
      <div className={`px-5 pt-5 pb-4 border-b ${border} shrink-0`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-lg font-black tracking-tight ${textPrimary}`}>Chats</h2>
          <span className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-bold ${
            dk ? 'bg-green-500/15 text-green-400' : 'bg-green-50 text-green-600'
          }`}>
            <BsCircleFill className="text-[8px]" />
            {onlineCount} online
          </span>
        </div>

        {/* Global / Private toggle */}
        <div className={`flex p-1 rounded-xl ${dk ? 'bg-white/5' : 'bg-gray-200/70'}`}>
          <button
            onClick={switchToGlobal}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
              chatMode === 'global'
                ? dk ? 'bg-white text-black shadow-md' : 'bg-white text-gray-900 shadow-md'
                : textMuted
            }`}
          >
            <BsGlobe2 className="text-sm" /> Global
          </button>
          <button
            onClick={() => { setChatMode('private'); if (window.innerWidth < 768) setShowUsers(true); }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
              chatMode === 'private'
                ? dk ? 'bg-white text-black shadow-md' : 'bg-white text-gray-900 shadow-md'
                : textMuted
            }`}
          >
            <BsLockFill className="text-sm" /> Private
          </button>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto min-h-0">

        {/* General chat button (global mode) */}
        {chatMode === 'global' && (
          <div className="px-3 pt-3">
            <button
              onClick={switchToGlobal}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
                dk ? 'bg-white/10 ring-1 ring-white/20' : 'bg-primary/5 ring-1 ring-primary/20'
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-linear-to-br from-primary to-primary-dark flex items-center justify-center shrink-0">
                <BsGlobe2 className="text-white text-base" />
              </div>
              <div className="text-left flex-1 min-w-0">
                <p className={`text-sm font-bold ${textPrimary}`}>General</p>
                <p className={`text-xs truncate ${textMuted}`}>All team members</p>
              </div>
              <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
            </button>
          </div>
        )}

        {/* Search (private mode) */}
        {chatMode === 'private' && (
          <div className="px-3 pt-3">
            <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border ${
              dk ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'
            }`}>
              <BsSearch className={`text-sm shrink-0 ${textMuted}`} />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search people..."
                className={`flex-1 bg-transparent text-sm outline-none ${textPrimary}`}
              />
            </div>
          </div>
        )}

        {/* User list */}
        <div className="py-2 px-3 space-y-0.5">
          {chatMode === 'private' ? (
            filteredContacts.length > 0 ? filteredContacts.map((contact) => {
              const online = onlineIds.has(contact._id);
              const isActive = activeRecipient?._id === contact._id;
              return (
                <button
                  key={contact._id}
                  onClick={() => handleSelectUser(contact)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-left ${
                    isActive
                      ? dk ? 'bg-white/10 ring-1 ring-white/20' : 'bg-primary/5 ring-1 ring-primary/20'
                      : dk ? 'hover:bg-white/5' : 'hover:bg-gray-100'
                  }`}
                >
                  <div className="relative shrink-0">
                    <Avatar name={contact.fullName} id={contact._id} />
                    <OnlineDot online={online} dk={dk} borderColor={dk ? 'border-[#0f0f0f]' : 'border-gray-50'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className={`text-sm font-bold truncate ${textPrimary}`}>{contact.fullName}</p>
                      <RoleBadge role={contact.role} />
                    </div>
                    <p className={`text-xs ${online ? 'text-green-500' : textMuted}`}>
                      {online ? 'Online' : 'Offline'}
                    </p>
                  </div>
                  {isActive && <div className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                  {!isActive && (unreadPrivate[contact._id] || 0) > 0 && (
                    <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-black bg-red-500 text-white shrink-0">
                      {unreadPrivate[contact._id] > 99 ? '99+' : unreadPrivate[contact._id]}
                    </span>
                  )}
                </button>
              );
            }) : (
              <div className={`text-center py-8 ${textMuted} text-sm`}>
                {searchQuery ? 'No results found' : (
                  <div className="flex flex-col items-center gap-2">
                    <BsPeopleFill className="text-2xl opacity-30" />
                    <p>No contacts available</p>
                  </div>
                )}
              </div>
            )
          ) : (
            /* Global mode — team members roster */
            <div className="pt-3">
              <p className={`text-[10px] font-black uppercase tracking-widest px-2 mb-2 ${textMuted}`}>
                Team Members
              </p>
              {contacts.map((c) => {
                const online = onlineIds.has(c._id);
                return (
                  <div key={c._id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl">
                    <div className="relative shrink-0">
                      <Avatar name={c.fullName} id={c._id} size="sm" />
                      <OnlineDot online={online} dk={dk} borderColor={dk ? 'border-[#0f0f0f]' : 'border-gray-50'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className={`text-xs font-bold truncate ${textPrimary}`}>{c.fullName}</p>
                        <RoleBadge role={c.role} />
                      </div>
                      <p className={`text-[10px] ${online ? 'text-green-500' : textMuted}`}>
                        {online ? 'Online' : 'Offline'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
