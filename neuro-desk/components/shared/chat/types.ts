export interface Message {
  _id: string;
  senderId: string | { _id: string; fullName: string; email: string };
  message: string;
  timestamp: string;
  roomId?: string;
  recipientId?: string;
  roomType?: string;
}

export interface UserContact {
  _id: string;
  fullName: string;
  email: string;
  role: string;
}

export type ChatMode = 'global' | 'private';
