'use client';

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser, selectIsAuthenticated } from '@/lib/features/auth/authSlice';
import { io, Socket } from 'socket.io-client';

/* ─── helpers (duplicated from Chat — kept minimal) ── */
const getSenderId = (s: string | { _id: string }) =>
  typeof s === 'object' ? s._id : s;

/* ─── Context shape ──────────────────────────── */
interface SocketContextValue {
  socket: Socket | null;
  onlineIds: Set<string>;
  unreadCount: number;
  clearUnread: () => void;
  /** Per-sender unread private message counts */
  unreadPrivate: Record<string, number>;
  clearUnreadFor: (senderId: string) => void;
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  onlineIds: new Set(),
  unreadCount: 0,
  clearUnread: () => {},
  unreadPrivate: {},
  clearUnreadFor: () => {},
});

export const useSocket = () => useContext(SocketContext);

/* ─── Provider ───────────────────────────────── */
export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const user = useSelector(selectCurrentUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  const [socketState, setSocketState] = useState<Socket | null>(null);
  const [onlineIds, setOnlineIds] = useState<Set<string>>(new Set());
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadPrivate, setUnreadPrivate] = useState<Record<string, number>>({});
  const userRef = useRef(user);

  useEffect(() => { userRef.current = user; }, [user]);

  const clearUnread = useCallback(() => setUnreadCount(0), []);
  const clearUnreadFor = useCallback((senderId: string) => {
    setUnreadPrivate((prev) => {
      if (!prev[senderId]) return prev;
      const next = { ...prev };
      delete next[senderId];
      return next;
    });
  }, []);

  /* ── Connect socket when authenticated, disconnect on cleanup ── */
  useEffect(() => {
    if (!isAuthenticated) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';
    const socketUrl = apiBaseUrl.replace('/api', '');

    const s = io(socketUrl, { auth: { token } });

    s.on('connect', () => {
      console.log('[SocketProvider] Connected');
      s.emit('room:join', 'team_general');
      setSocketState(s);
    });

    /* Presence — exclude self */
    s.on('presence:list', (ids: string[]) => {
      const myId = userRef.current?._id;
      setOnlineIds(new Set(ids.filter((id) => id !== myId)));
    });

    s.on('presence:update', ({ userId, isOnline }: { userId: string; isOnline: boolean }) => {
      const myId = userRef.current?._id;
      if (userId === myId) return;
      setOnlineIds((prev) => {
        const next = new Set(prev);
        if (isOnline) next.add(userId); else next.delete(userId);
        return next;
      });
    });

    /* ── Message listener for unread tracking ── */
    s.on('chat:message', (msg: { senderId: string | { _id: string }; recipientId?: string; roomId?: string }) => {
      const myId = userRef.current?._id ?? '';
      const msgSenderId = String(getSenderId(msg.senderId));

      // Sidebar unread badge (all messages while not on chat tab)
      const params = new URLSearchParams(window.location.search);
      const currentTab = params.get('tab');
      if (currentTab !== 'team-chat') {
        setUnreadCount((c) => c + 1);
      }

      // Per-sender unread badge (private messages TO me from someone else)
      if (msg.recipientId && String(msg.recipientId) === myId && msgSenderId !== myId) {
        setUnreadPrivate((prev) => ({
          ...prev,
          [msgSenderId]: (prev[msgSenderId] || 0) + 1,
        }));
      }
    });

    return () => {
      s.disconnect();
      setSocketState(null);
      setOnlineIds(new Set());
      setUnreadCount(0);
      setUnreadPrivate({});
    };
  }, [isAuthenticated]);

  return (
    <SocketContext.Provider value={{ socket: socketState, onlineIds, unreadCount, clearUnread, unreadPrivate, clearUnreadFor }}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketProvider;
