import React from 'react';
import { BsSendFill, BsCircleFill } from 'react-icons/bs';
import { UserContact, ChatMode } from './types';
import { Avatar } from './ui';

interface Props {
  chatMode: ChatMode;
  activeRecipient: UserContact | null;
  newMessage: string;
  setNewMessage: (v: string) => void;
  handleSend: (e: React.FormEvent) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  user: { _id?: string; fullName?: string; role?: string } | null;
  dk: boolean;
  border: string;
  textPrimary: string;
  textMuted: string;
}

export default function ChatInput({
  chatMode, activeRecipient, newMessage, setNewMessage,
  handleSend, inputRef, user, dk, border, textPrimary, textMuted
}: Props) {
  return (
    <div className={`px-4 md:px-5 py-4 border-t shrink-0 ${border} ${dk ? 'bg-[#111111]' : 'bg-gray-50/80'}`}>
      {chatMode === 'private' && !activeRecipient ? (
        <p className={`text-center text-sm py-1 ${textMuted}`}>Select a user to start a private chat</p>
      ) : (
        <form onSubmit={handleSend} className="flex items-center gap-3">
          <Avatar name={user?.fullName || '?'} id={user?._id || '0'} size="sm" />
          <div className={`flex-1 flex items-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${
            dk
              ? 'bg-[#0a0a0a] border-white/8 focus-within:border-primary/50'
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
  );
}
