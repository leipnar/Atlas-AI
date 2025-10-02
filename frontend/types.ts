export type Language = 'en' | 'fa';

export type ModelProvider = 'google' | 'openai' | 'openrouter';

export type SupportedModelId =
  // Google
  | 'gemini-2.5-flash'
  | 'gemini-2-flash'
  | 'gemini-2.5-pro'
  // OpenAI
  | 'gpt-4o'
  | 'gpt-4-turbo'
  | 'gpt-3.5-turbo'
  | 'gpt-o3-mini'
  | 'gpt-5'
  // OpenRouter / Meta
  | 'meta-llama/llama-3-8b-instruct'
  | 'meta-llama/llama-3-70b-instruct'
  | 'meta-llama/llama-3.3'
  | 'meta-llama/llama-4'
  // OpenRouter / DeepSeek
  | 'deepseek/deepseek-coder-v2'
  | 'deepseek/deepseek-v3'
  | 'deepseek/deepseek-v3.2'
  // OpenRouter / xAi
  | 'xai/grok-3'
  | 'xai/grok-4'
  // Allow any string for custom models from OpenRouter
  | string;

export interface ApiKeys {
  google: string;
  openai: string;
  openrouter: string;
}

export interface CustomOpenRouterModel {
  id: string; // This will be the full path like 'mistralai/mistral-7b-instruct'
  name: string; // This is the display name
}

export type UserRole = 'client' | 'support' | 'supervisor' | 'manager' | 'admin';

export interface User {
  username: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export interface UserCredentials extends User {
  password?: string;
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

export interface KnowledgeEntry {
  id: string;
  tag: string;
  content: string;
  lastUpdated: number;
  updatedBy: string;
}

export interface ModelConfig {
  provider: ModelProvider;
  model: SupportedModelId;
  temperature: number;
  topP: number;
  topK: number;
  customInstruction: string;
}

export interface RolePermissions {
  canViewDashboard: boolean;
  canManageUsers: boolean;
  canManageRoles: boolean;
  canManageKB: boolean;
  canViewModelConfig: boolean;
  canEditModelConfig: boolean;
  canViewCompanySettings: boolean;
  canEditCompanySettings: boolean;
  canViewChatLogs: boolean;
  canViewSmtpSettings: boolean;
  canEditSmtpSettings: boolean;
  canCustomizePanel: boolean;
  canManageBackups: boolean;
  canImportUsers: boolean;
}

export type AllRolePermissions = Record<UserRole, RolePermissions>;

export interface CompanyInfo {
  logo: string | null;
  en: {
    name: string;
    about: string;
  };
  fa: {
    name: string;
    about: string;
  };
}

export interface PanelConfig {
  aiNameEn: string;
  aiNameFa: string;
  chatHeaderTitleEn: string;
  chatHeaderTitleFa: string;
  chatPlaceholderEn: string;
  chatPlaceholderFa: string;
  welcomeMessageEn: string;
  welcomeMessageFa: string;
  aiAvatar: string | null;
  privacyPolicyEn: string;
  privacyPolicyFa: string;
  termsOfServiceEn: string;
  termsOfServiceFa: string;
}

export interface Conversation {
  id: string;
  user: UserCredentials;
  startTime: number;
  messages: ChatMessage[];
}

export interface ConversationSummary {
  id: string;
  user: {
    username: string;
    firstName: string;
    lastName: string;
  };
  firstMessage: string;
  startTime: number;
  messageCount: number;
}

export interface EmailTemplate {
    subject: string;
    body: string;
}

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password?: string;
  emailTemplates: {
      passwordReset: EmailTemplate;
      emailVerification: EmailTemplate;
  }
}

export interface BackupSchedule {
  enabled: boolean;
  frequency: 'daily' | 'weekly';
  dayOfWeek: number; // 0=Sunday, 1=Monday...
  time: string; // HH:mm format
}

export interface GoogleDriveConfig {
  connected: boolean;
  email: string | null;
}

export type DashboardSection =
    | 'dashboard'
    | 'users'
    | 'roles'
    | 'knowledge'
    | 'model'
    | 'company'
    | 'panel'
    | 'logs'
    | 'smtp'
    | 'backup'
    | 'account';

// FIX: Added 'full' to BackupType to allow for a full backup option, resolving type errors.
export type BackupType = 'panelConfig' | 'modelConfig' | 'knowledgeBase' | 'database' | 'smtpConfig' | 'companyInfo' | 'permissions' | 'full';