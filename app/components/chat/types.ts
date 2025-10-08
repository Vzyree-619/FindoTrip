export type UserRole =
  | "CUSTOMER"
  | "PROPERTY_OWNER"
  | "VEHICLE_OWNER"
  | "TOUR_GUIDE"
  | "SUPER_ADMIN";

export type MessageStatus = "sending" | "sent" | "delivered" | "read";
export type MessageType = "text" | "image" | "file" | "system";

export type Attachment = {
  id?: string;
  type: "image" | "file";
  url: string;
  name?: string;
  size?: number; // bytes
  mimeType?: string;
};

export type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  senderName?: string;
  senderAvatar?: string;
  content: string;
  type: MessageType;
  attachments?: Attachment[];
  createdAt: string | Date;
  status?: MessageStatus;
  replyToId?: string;
};

export type Participant = {
  id: string;
  name?: string;
  avatar?: string;
  role?: UserRole | string;
  online?: boolean;
};

export type Conversation = {
  id: string;
  participants: Participant[];
  lastMessage?: Message;
  unreadCount?: number;
  updatedAt: string | Date;
  serviceId?: string;
  bookingId?: string;
};

export type ChatRealtimeEvent = {
  type: "chat_message" | "typing" | "read_receipt" | "conversation_updated";
  conversationId: string;
  message?: Message;
  senderId?: string;
  readUpToMessageId?: string;
};

export type FetchConversationResult = {
  conversation: Conversation;
  messages: Message[];
};
