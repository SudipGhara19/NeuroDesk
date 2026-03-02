import React from 'react';
import { BsLockFill } from 'react-icons/bs';
import { Message, UserContact, ChatMode } from './types';
import { Avatar, RoleBadge, getSenderId, getSenderName } from './ui';

interface Props {
  messages: Message[];
  loading: boolean;
  chatMode: ChatMode;
  activeRecipient: UserContact | null;
  user: { _id?: string; fullName?: string; role?: string } | null;
  dk: boolean;
  textPrimary: string;
  textMuted: string;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  contacts: UserContact[];
}

export default function MessageList({
  messages, loading, chatMode, activeRecipient,
  user, dk, textPrimary, textMuted, messagesEndRef, contacts
}: Props) {

  const isMe = (msg: Message) => String(getSenderId(msg.senderId)) === String(user?._id);

  const resolveName = (msg: Message) => {
    const name = getSenderName(msg.senderId);
    if (name) return name;
    return contacts.find((c) => c._id === getSenderId(msg.senderId))?.fullName || 'Unknown';
  };

  const resolveRole = (msg: Message): string | undefined => {
    const id = getSenderId(msg.senderId);
    return contacts.find((c) => c._id === id)?.role;
  };

  return (
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
                      <p className="text-[14px] leading-relaxed whitespace-pre-wrap wrap-break-word">{msg.message}</p>
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
  );
}
