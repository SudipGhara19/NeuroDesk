'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '@/lib/features/auth/authSlice';
import { useTheme } from '@/components/providers/ThemeProvider';
import { useSocket } from '@/components/providers/SocketProvider';
import {
  BsSendFill, BsGlobe2, BsLockFill, BsPeopleFill,
  BsChevronLeft, BsSearch, BsCircleFill, BsXLg, BsShieldFill
} from 'react-icons/bs';
import api from '@/lib/axios';

/* ─── Types ─────────────────────────────────────────── */
interface Message {
  _id: string;
  senderId: string | { _id: string; fullName: string; email: string };
  message: string;
  timestamp: string;
  roomId?: string;
  recipientId?: string;
  roomType?: string;
}

interface UserContact {
  _id: string;
  fullName: string;
  email: string;
  role: string;
}

type ChatMode = 'global' | 'private';

/* ─── Helpers ────────────────────────────────────────── */
const getSenderId = (s: Message['senderId']) =>
  typeof s === 'object' ? s._id : s;

const getSenderName = (s: Message['senderId']) =>
  typeof s === 'object' ? s.fullName : null;

const getInitial = (name: string) => name.trim().charAt(0).toUpperCase();

const avatarColors = [
  'from-violet-500 to-purple-700',
  'from-sky-400 to-blue-600',
  'from-emerald-400 to-teal-600',
  'from-rose-400 to-pink-600',
  'from-amber-400 to-orange-600',
];
const getColor = (id: string) =>
  avatarColors[id.charCodeAt(id.length - 1) % avatarColors.length];

/* ─── Role badge ─────────────────────────────────────── */
const RoleBadge = ({ role }: { role: string }) => {
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

/* ─── Avatar ─────────────────────────────────────────── */
const Avatar = ({ name, id, size = 'md' }: { name: string; id: string; size?: 'sm' | 'md' }) => {
  const s = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm' };
  return (
    <div className={`${s[size]} rounded-full bg-linear-to-br ${getColor(id)} flex items-center justify-center font-bold text-white shrink-0 shadow-md`}>
      {getInitial(name)}
    </div>
  );
};

/* ─── Online dot ─────────────────────────────────────── */
const OnlineDot = ({ online, dk, borderColor }: { online: boolean; dk: boolean; borderColor: string }) => (
  <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 ${borderColor} ${
    online ? 'bg-green-500' : dk ? 'bg-gray-600' : 'bg-gray-300'
  }`} />
);

/* ─── Main Component ─────────────────────────────────── */
const Chat: React.FC = () => {
  const user = useSelector(selectCurrentUser);
  const { theme } = useTheme();
  const dk = theme === 'dark';

  const { socket, onlineIds, clearUnread, unreadPrivate, clearUnreadFor } = useSocket();

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [chatMode, setChatMode] = useState<ChatMode>('global');
  const [activeRecipient, setActiveRecipient] = useState<UserContact | null>(null);
  const [contacts, setContacts] = useState<UserContact[]>([]);
  const [showUsers, setShowUsers] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // Always-fresh refs for socket handler closure
  const chatModeRef = useRef<ChatMode>('global');
  const activeRecipientRef = useRef<UserContact | null>(null);
  const userRef = useRef(user);
  // Buffer for incoming private messages while that conversation isn't open
  const pendingPrivateRef = useRef<Record<string, Message[]>>({});

  useEffect(() => { chatModeRef.current = chatMode; }, [chatMode]);
  useEffect(() => { activeRecipientRef.current = activeRecipient; }, [activeRecipient]);
  useEffect(() => { userRef.current = user; }, [user]);

  // Clear sidebar unread badge when Chat mounts
  useEffect(() => { clearUnread(); }, [clearUnread]);

  /* ── Fetch team members ── */
  useEffect(() => {
    api.get('/users/members')
      .then(({ data }) => {
        setContacts((data as UserContact[]).filter((u) => u._id !== user?._id));
      })
      .catch(() => {});
  }, [user?._id]);

  /* ── Message handler — listens on global socket ── */
  useEffect(() => {
    if (!socket) return;

    const handler = (msg: Message) => {
      const mode = chatModeRef.current;
      const recipient = activeRecipientRef.current;
      const myId = userRef.current?._id ?? '';
      const msgSenderId = String(getSenderId(msg.senderId));

      /* Helper to replace a temp message or append */
      const addOrReplace = (prev: Message[]): Message[] => {
        if (prev.some((m) => m._id === msg._id)) return prev;
        const tempIdx = prev.findIndex(
          (m) => m._id.startsWith('temp_') &&
            String(getSenderId(m.senderId)) === msgSenderId &&
            m.message === msg.message
        );
        if (tempIdx !== -1) {
          const next = [...prev];
          next[tempIdx] = msg;
          return next;
        }
        return [...prev, msg];
      };

      if (!msg.recipientId) {
        /* ── Global / room message ── */
        if (!!msg.roomId) {
          setMessages(addOrReplace);
        }
      } else {
        /* ── Private message ── */
        const msgRecipientId = String(msg.recipientId);
        const isToMe = msgRecipientId === myId;
        const isFromMe = msgSenderId === myId;
        const otherParty = isFromMe ? msgRecipientId : msgSenderId;

        if (isToMe || isFromMe) {
          const viewingThisConvo =
            mode === 'private' &&
            recipient != null &&
            String(recipient._id) === otherParty;

          if (viewingThisConvo) {
            setMessages(addOrReplace);
          } else {
            const buf = pendingPrivateRef.current;
            if (!buf[otherParty]) buf[otherParty] = [];
            if (!buf[otherParty].some((m) => m._id === msg._id)) {
              buf[otherParty].push(msg);
            }
          }
        }
      }
    };

    socket.on('chat:message', handler);
    return () => { socket.off('chat:message', handler); };
  }, [socket]);

  /* ── Fetch history when mode / recipient changes ── */
  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setMessages([]);
    try {
      if (chatMode === 'global') {
        // Fetch both team_general (new) and legacy global messages
        const [r1, r2] = await Promise.allSettled([
          api.get('/chats/team_general'),
          api.get('/chats/global'),
        ]);
        const msgs1 = r1.status === 'fulfilled' ? r1.value.data : [];
        const msgs2 = r2.status === 'fulfilled' ? r2.value.data : [];
        // Merge and sort chronologically, deduplicate by _id
        const merged = [...msgs1, ...msgs2];
        const deduped = merged.filter(
          (m, i, arr) => arr.findIndex((x) => x._id === m._id) === i
        );
        deduped.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        setMessages(deduped);
      } else if (activeRecipient) {
        const { data } = await api.get(`/chats/${activeRecipient._id}`);
        setMessages(data);
      }
    } catch { /* ok */ }
    finally { setLoading(false); }
  }, [chatMode, activeRecipient]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  /* ── Auto-scroll ── */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /* ── Send message with optimistic local echo ── */
  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket) return;
    const trimmed = newMessage.trim();

    // Optimistic: show the message immediately in the sender's UI
    const tempId = `temp_${Date.now()}`;
    const optimisticMsg: Message = {
      _id: tempId,
      senderId: user?._id || '',
      message: trimmed,
      timestamp: new Date().toISOString(),
      roomId: chatMode === 'global' ? 'team_general' : undefined,
      recipientId: chatMode === 'private' ? activeRecipient?._id : undefined,
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    if (chatMode === 'global') {
      socket.emit('chat:message', { message: trimmed, roomId: 'team_general', roomType: 'global' });
    } else if (activeRecipient) {
      socket.emit('chat:message', { message: trimmed, recipientId: activeRecipient._id, roomType: 'private' });
    }
    setNewMessage('');
    inputRef.current?.focus();
  };

  /* ── isMe: safe string comparison handles ObjectId vs string from API populate ── */
  const isMe = (msg: Message) => String(getSenderId(msg.senderId)) === String(user?._id);

  /* ── Select private chat — flush pending messages for this sender ── */
  const handleSelectUser = (contact: UserContact) => {
    setActiveRecipient(contact);
    setChatMode('private');
    // Flush any pending messages that arrived before the user opened this chat
    const pending = pendingPrivateRef.current[contact._id] || [];
    if (pending.length > 0) {
      setMessages((prev) => {
        let next = [...prev];
        for (const msg of pending) {
          if (!next.some((m) => m._id === msg._id)) next = [...next, msg];
        }
        next.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        return next;
      });
      // Clear the buffer for this sender
      delete pendingPrivateRef.current[contact._id];
    }
    // Clear unread count for this contact
    clearUnreadFor(contact._id);
    if (window.innerWidth < 768) setShowUsers(false);
  };

  /* ── Switch to global ── */
  const switchToGlobal = () => {
    setChatMode('global');
    setActiveRecipient(null);
    socket?.emit('room:join', 'team_general');
    if (window.innerWidth < 768) setShowUsers(false);
  };

  const filteredContacts = contacts.filter((c) =>
    c.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );


  const resolveName = (msg: Message) => {
    const name = getSenderName(msg.senderId);
    if (name) return name;
    return contacts.find((c) => c._id === getSenderId(msg.senderId))?.fullName || 'Unknown';
  };

  const resolveRole = (msg: Message): string | undefined => {
    const id = getSenderId(msg.senderId);
    return contacts.find((c) => c._id === id)?.role;
  };

  /* ── Theme shortcuts ── */
  const sideBg = dk ? 'bg-[#0f0f0f]' : 'bg-gray-50';
  const mainBg = dk ? 'bg-[#141414]' : 'bg-white';
  const border = dk ? 'border-white/[0.08]' : 'border-gray-200';
  const textPrimary = dk ? 'text-white' : 'text-gray-900';
  const textMuted = dk ? 'text-gray-400' : 'text-gray-500';

  // Only count OTHER users as online (self is excluded from the list)
  const onlineCount = contacts.filter((c) => onlineIds.has(c._id)).length;

  return (
    <div className={`flex h-full border overflow-hidden shadow-xl ${mainBg} ${border}`}>

      {/* ─── LEFT PANEL ──────────────────────────────── */}
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

      {/* ─── RIGHT PANEL ─────────────────────────────── */}
      <div className={`flex flex-col flex-1 min-w-0 min-h-0 ${mainBg}`}>

        {/* Chat header */}
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

        {/* Messages — must overflow-y-auto, flex-1, min-h-0 */}
        <div className="flex-1 overflow-y-auto min-h-0 px-4 md:px-6 py-5 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <span className={`text-xs font-black tracking-widest uppercase animate-pulse ${textMuted}`}>Loading…</span>
            </div>
          ) : (chatMode === 'private' && !activeRecipient) ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 select-none">
              <div className={`w-20 h-20 rounded-2xl flex items-center justify-center ${dk ? 'bg-white/5' : 'bg-gray-100'}`}>
                <BsLockFill className={`text-3xl opacity-30 ${textMuted}`} />
              </div>
              <p className={`font-bold ${textPrimary}`}>Select someone to chat with</p>
              <p className={`text-sm text-center max-w-xs ${textMuted}`}>Choose a contact from the left panel to start a private conversation.</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 select-none">
              <div className={`w-20 h-20 rounded-2xl flex items-center justify-center ${dk ? 'bg-white/5' : 'bg-gray-100'}`}>
                <span className="text-4xl">👋</span>
              </div>
              <p className={`font-bold ${textPrimary}`}>No messages yet</p>
              <p className={`text-sm ${textMuted}`}>Say hello and start the conversation!</p>
            </div>
          ) : (
            <>
              {messages.map((msg, idx) => {
                const mine = isMe(msg);
                const name = mine ? (user?.fullName || 'You') : resolveName(msg);
                const role = mine ? user?.role : resolveRole(msg);
                const senderId = getSenderId(msg.senderId);

                const showDate = idx === 0 ||
                  new Date(msg.timestamp).toDateString() !== new Date(messages[idx - 1].timestamp).toDateString();

                return (
                  <React.Fragment key={msg._id || idx}>
                    {showDate && (
                      <div className="flex items-center gap-3 my-2">
                        <div className={`flex-1 h-px ${dk ? 'bg-white/10' : 'bg-gray-200'}`} />
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-3 ${textMuted}`}>
                          {new Date(msg.timestamp).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                        </span>
                        <div className={`flex-1 h-px ${dk ? 'bg-white/10' : 'bg-gray-200'}`} />
                      </div>
                    )}

                    <div className={`flex gap-2.5 ${mine ? 'flex-row-reverse' : 'flex-row'} group items-end`}>
                      {!mine && <Avatar name={name} id={senderId} size="sm" />}

                      <div className={`flex flex-col gap-1 max-w-[75%] ${mine ? 'items-end' : 'items-start'}`}>
                        {/* Show 'You' for own messages, name for others — only in global */}
                        {chatMode === 'global' && (
                          <span className={`flex items-center gap-1.5 text-[11px] font-bold ml-1 ${mine ? textMuted : textMuted}`}>
                            {mine ? 'You' : name}
                            {!mine && role && <RoleBadge role={role} />}
                          </span>
                        )}

                        <div className={`px-4 py-2.5 rounded-2xl shadow-sm ${
                          mine
                            ? 'bg-linear-to-br from-primary to-primary-dark text-white rounded-br-sm'
                            : dk
                              ? 'bg-[#252525] text-white border border-white/5 rounded-bl-sm'
                              : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                        }`}>
                          <p className="text-[14px] leading-relaxed whitespace-pre-wrap break-words">{msg.message}</p>
                        </div>

                        <span className={`text-[10px] font-semibold px-1 opacity-0 group-hover:opacity-100 transition-opacity ${textMuted}`}>
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {mine && <Avatar name={user?.fullName || '?'} id={user?._id || '0'} size="sm" />}
                    </div>
                  </React.Fragment>
                );
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input */}
        <div className={`px-4 md:px-5 py-4 border-t shrink-0 ${border} ${dk ? 'bg-[#111111]' : 'bg-gray-50/80'}`}>
          {chatMode === 'private' && !activeRecipient ? (
            <p className={`text-center text-sm py-1 ${textMuted}`}>Select a user to start a private chat</p>
          ) : (
            <form onSubmit={handleSend} className="flex items-center gap-3">
              <Avatar name={user?.fullName || '?'} id={user?._id || '0'} size="sm" />
              <div className={`flex-1 flex items-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${
                dk
                  ? 'bg-[#0a0a0a] border-white/[0.08] focus-within:border-primary/50'
                  : 'bg-white border-gray-200 focus-within:border-primary/40'
              }`}>
                <input
                  ref={inputRef}
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={chatMode === 'global' ? 'Message the team…' : `Message ${activeRecipient?.fullName}…`}
                  className={`flex-1 bg-transparent outline-none text-[15px] font-medium ${textPrimary} placeholder:text-gray-400`}
                />
                {chatMode === 'global' && (
                  <BsCircleFill className="text-green-400 text-[8px] shrink-0 animate-pulse" />
                )}
              </div>
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="w-12 h-12 rounded-xl bg-primary hover:bg-primary-dark text-white disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-all hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0 shrink-0"
              >
                <BsSendFill className="text-base" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;
