export type Language = 'en' | 'fa';

export type UserRole = 'admin' | 'manager' | 'supervisor' | 'support' | 'client';

export interface User {
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

export interface ChatMessage {
  id: string;
  sender: 'user' | 'atlas';
  text: string;
  timestamp: number;
  isError?: boolean;
  feedback?: 'good' | 'bad';
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

export type SupportedModel = 'gemini-2.5-flash' | 'gpt-4o' | 'llama3-70b';

export interface ModelConfig {
    model: SupportedModel;
    customInstruction: string;
    temperature: number;
    topP: number;
    topK: number;
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

export interface KnowledgeEntry {
    id: string;
    tag: string;
    content: string;
    lastUpdated: number;
    updatedBy: string;
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

export type AllRolePermissions = {
    [key in UserRole]: RolePermissions;
};

export interface SmtpConfig {
    host: string;
    port: number;
    secure: boolean;
    username: string;
    password?: string;
}

export interface ModelInfo {
    id: SupportedModel;
    name: string;
    description: string;
}

export interface ModelGroup {
    provider: string;
    models: ModelInfo[];
}
