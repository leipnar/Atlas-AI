export type UserRole = 'admin' | 'manager' | 'supervisor' | 'support' | 'client';

export interface User {
  _id?: string;
  username: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export interface UserCredentials extends User {
  password: string;
  email: string;
  mobile: string;
  emailVerified: boolean;
  ip: string;
  device: string;
  os: string;
}

export interface UserDocument extends Omit<UserCredentials, 'password'> {
  _id: string;
  password: string;
  createdAt: Date;
  lastLogin?: {
    timestamp: Date;
    ip: string;
    device: string;
    os: string;
  };
}

export interface KnowledgeEntry {
  id: string;
  tag: string;
  content: string;
  lastUpdated: number;
  updatedBy: string;
}

export interface KnowledgeEntryDocument {
  _id: string;
  tag: string;
  content: string;
  lastUpdated: Date;
  updatedBy: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'atlas';
  text: string;
  timestamp: number;
  isError?: boolean;
  feedback?: 'good' | 'bad';
}

export interface Message {
  id: string;
  sender: 'user' | 'atlas';
  text: string;
  timestamp: Date;
  isError?: boolean;
  feedback?: 'good' | 'bad' | null;
}

export interface Conversation {
  id: string;
  user: UserCredentials;
  startTime: number;
  messageCount: number;
  firstMessage: string;
  messages: ChatMessage[];
}

export interface ConversationSummary {
  id: string;
  user: UserCredentials;
  startTime: number;
  messageCount: number;
  firstMessage: string;
}

export interface ConversationDocument {
  _id: string;
  userId: string;
  startTime: Date;
  messages: Message[];
}

export interface RolePermissions {
  canViewDashboard: boolean;
  canManageUsers: boolean;
  canManageKnowledgeBase: boolean;
  canViewChatLogs: boolean;
  canManageRoles: boolean;
  canConfigureModel: boolean;
  canManageCompanyInfo: boolean;
  canConfigureSmtp: boolean;
}

export interface AllRolePermissions {
  admin: RolePermissions;
  manager: RolePermissions;
  supervisor: RolePermissions;
  support: RolePermissions;
  client: RolePermissions;
}

export type SupportedModel = 'gemini-2.5-flash' | 'gpt-4o' | 'llama3-70b';

export interface ModelConfig {
  model: SupportedModel;
  customInstruction: string;
  temperature: number;
  topP: number;
  topK: number;
}

export interface CompanyInfoLocale {
  name: string;
  about: string;
}

export interface CompanyInfo {
  en: CompanyInfoLocale;
  fa: CompanyInfoLocale;
  logo: string | null;
}

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  fromEmail: string;
  fromName: string;
}

export interface ApplicationConfig {
  _id?: string;
  permissions: AllRolePermissions;
  modelConfig: ModelConfig;
  companyInfo: CompanyInfo;
  smtpConfig: SmtpConfig;
  geminiApiKey: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  user?: User;
  message?: string;
}

export interface UpdatePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface FeedbackRequest {
  messageId: string;
  feedback: 'good' | 'bad';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

