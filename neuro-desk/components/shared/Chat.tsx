'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '@/lib/features/auth/authSlice';
import { useTheme } from '@/components/providers/ThemeProvider';
import { useSocket } from '@/components/providers/SocketProvider';
import api from '@/lib/axios';

import { Message, UserContact, ChatMode } from './chat/types';
import ChatSidebar from './chat/ChatSidebar';
import ChatHeader from './chat/ChatHeader';
import MessageList from './chat/MessageList';
import ChatInput from './chat/ChatInput';

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
  const chatModeRef = useRef<ChatMode>('global');
  const activeRecipientRef = useRef<UserContact | null>(null);
  const userRef = useRef(user);
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
      const msgSenderId = typeof msg.senderId === 'object' ? msg.senderId._id : msg.senderId;

      const addOrReplace = (prev: Message[]): Message[] => {
        if (prev.some((m) => m._id === msg._id)) return prev;
        const tempIdx = prev.findIndex(
          (m) => m._id.startsWith('temp_') &&
            (typeof m.senderId === 'object' ? m.senderId._id : m.senderId) === msgSenderId &&
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
        if (!!msg.roomId) {
          setMessages(addOrReplace);
        }
      } else {
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
        const [r1, r2] = await Promise.allSettled([
          api.get('/chats/team_general'),
          api.get('/chats/global'),
        ]);
        const msgs1 = r1.status === 'fulfilled' ? r1.value.data : [];
        const msgs2 = r2.status === 'fulfilled' ? r2.value.data : [];
        const merged = [...msgs1, ...msgs2];
        const deduped = merged.filter((m, i, arr) => arr.findIndex((x) => x._id === m._id) === i);
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

  /* ── Select private chat — flush pending messages for this sender ── */
  const handleSelectUser = (contact: UserContact) => {
    setActiveRecipient(contact);
    setChatMode('private');
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
      delete pendingPrivateRef.current[contact._id];
    }
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

  /* ── Theme shortcuts ── */
  const sideBg = dk ? 'bg-[#0f0f0f]' : 'bg-gray-50';
  const mainBg = dk ? 'bg-[#141414]' : 'bg-white';
  const border = dk ? 'border-white/8' : 'border-gray-200';
  const textPrimary = dk ? 'text-white' : 'text-gray-900';
  const textMuted = dk ? 'text-gray-400' : 'text-gray-500';

  const onlineCount = contacts.filter((c) => onlineIds.has(c._id)).length;

  return (
    <div className={`flex h-full border overflow-hidden shadow-xl ${mainBg} ${border}`}>
      <ChatSidebar
        showUsers={showUsers} dk={dk} sideBg={sideBg} border={border}
        textPrimary={textPrimary} textMuted={textMuted} onlineCount={onlineCount}
        chatMode={chatMode} switchToGlobal={switchToGlobal} setChatMode={setChatMode}
        setShowUsers={setShowUsers} searchQuery={searchQuery} setSearchQuery={setSearchQuery}
        filteredContacts={filteredContacts} contacts={contacts} onlineIds={onlineIds}
        activeRecipient={activeRecipient} handleSelectUser={handleSelectUser} unreadPrivate={unreadPrivate}
      />

      <div className={`flex flex-col flex-1 min-w-0 min-h-0 ${mainBg}`}>
        <ChatHeader
          dk={dk} border={border} textPrimary={textPrimary} textMuted={textMuted}
          setShowUsers={setShowUsers} showUsers={showUsers} chatMode={chatMode}
          activeRecipient={activeRecipient} onlineIds={onlineIds}
        />

        <MessageList
          messages={messages} loading={loading} chatMode={chatMode}
          activeRecipient={activeRecipient} user={user} dk={dk}
          textPrimary={textPrimary} textMuted={textMuted} messagesEndRef={messagesEndRef}
          contacts={contacts}
        />

        <ChatInput
          chatMode={chatMode} activeRecipient={activeRecipient} newMessage={newMessage}
          setNewMessage={setNewMessage} handleSend={handleSend} inputRef={inputRef}
          user={user} dk={dk} border={border} textPrimary={textPrimary} textMuted={textMuted}
        />
      </div>
    </div>
  );
};

export default Chat;
