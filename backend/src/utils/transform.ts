import {
  User,
  UserCredentials,
  UserDocument,
  KnowledgeEntry,
  KnowledgeEntryDocument,
  ChatMessage,
  Message,
  Conversation,
  ConversationDocument,
  ConversationSummary
} from '../types';

// Transform MongoDB document to frontend format
export const transformUser = (doc: UserDocument): User => ({
  username: doc.username,
  firstName: doc.firstName,
  lastName: doc.lastName,
  role: doc.role
});

export const transformUserCredentials = (doc: UserDocument): UserCredentials => ({
  username: doc.username,
  firstName: doc.firstName,
  lastName: doc.lastName,
  role: doc.role,
  password: doc.password,
  email: doc.email,
  mobile: doc.mobile,
  emailVerified: doc.emailVerified,
  ip: doc.lastLogin?.ip || 'N/A',
  device: doc.lastLogin?.device || 'N/A',
  os: doc.lastLogin?.os || 'N/A'
});

export const transformKnowledgeEntry = (doc: KnowledgeEntryDocument): KnowledgeEntry => ({
  id: doc._id.toString(),
  tag: doc.tag,
  content: doc.content,
  lastUpdated: doc.lastUpdated.getTime(),
  updatedBy: doc.updatedBy
});

export const transformMessage = (msg: Message): ChatMessage => ({
  id: msg.id,
  sender: msg.sender,
  text: msg.text,
  timestamp: msg.timestamp.getTime(),
  isError: msg.isError || false,
  feedback: msg.feedback === null ? undefined : msg.feedback
});

export const transformConversation = (doc: ConversationDocument, user: UserCredentials): Conversation => {
  const messages = doc.messages.map(transformMessage);
  return {
    id: doc._id.toString(),
    user,
    startTime: doc.startTime.getTime(),
    messageCount: messages.length,
    firstMessage: messages.length > 0 ? messages[0].text : '',
    messages
  };
};

export const transformConversationSummary = (doc: ConversationDocument, user: UserCredentials): ConversationSummary => ({
  id: doc._id.toString(),
  user,
  startTime: doc.startTime.getTime(),
  messageCount: doc.messages.length,
  firstMessage: doc.messages.length > 0 ? doc.messages[0].text : ''
});

// Transform frontend data to MongoDB format
export const toMessageDocument = (chatMsg: ChatMessage): Message => ({
  id: chatMsg.id,
  sender: chatMsg.sender,
  text: chatMsg.text,
  timestamp: new Date(chatMsg.timestamp),
  isError: chatMsg.isError || false,
  feedback: chatMsg.feedback || null
});

export const toKnowledgeDocument = (entry: Partial<KnowledgeEntry>): Partial<KnowledgeEntryDocument> => ({
  tag: entry.tag,
  content: entry.content,
  lastUpdated: entry.lastUpdated ? new Date(entry.lastUpdated) : new Date(),
  updatedBy: entry.updatedBy
});

// Pagination response format to match frontend expectations
export interface FrontendPaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const createPaginatedResponse = <T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): FrontendPaginatedResponse<T> => ({
  data,
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit)
});

// Simple response formats that frontend expects
export interface SimpleResponse {
  success: boolean;
  message?: string;
}

export interface DataResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface UsersResponse {
  users: UserCredentials[];
  totalPages: number;
}

export interface LogsResponse {
  logs: ConversationSummary[];
  totalPages: number;
}