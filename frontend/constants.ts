import type { AllRolePermissions, SupportedModelId, KnowledgeEntry, UserRole, ModelProvider } from './types';

export const USER_ROLES: UserRole[] = ['admin', 'manager', 'supervisor', 'support', 'client'];

export const DEFAULT_PROVIDER: ModelProvider = 'google';
export const DEFAULT_MODEL: SupportedModelId = 'gemini-2.5-flash';

export const AVAILABLE_MODELS: { provider: ModelProvider; name: string; models: { id: SupportedModelId; name: string }[] }[] = [
  {
    provider: 'google',
    name: 'Google Gemini',
    models: [
      { id: 'gemini-2-flash', name: 'Gemini 2 Flash' },
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
      { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
    ],
  },
  {
    provider: 'openai',
    name: 'OpenAI',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o' },
      { id: 'gpt-o3-mini', name: 'GPT o3 mini' },
      { id: 'gpt-5', name: 'GPT 5' },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
    ],
  },
  {
    provider: 'openrouter',
    name: 'OpenRouter (Meta)',
    models: [
        { id: 'meta-llama/llama-3.3', name: 'Llama 3.3' },
        { id: 'meta-llama/llama-4', name: 'Llama 4' },
        { id: 'meta-llama/llama-3-8b-instruct', name: 'Llama 3 8B Instruct' },
        { id: 'meta-llama/llama-3-70b-instruct', name: 'Llama 3 70B Instruct' },
    ],
  },
  {
    provider: 'openrouter',
    name: 'OpenRouter (DeepSeek)',
    models: [
        { id: 'deepseek/deepseek-v3', name: 'DeepSeek V3' },
        { id: 'deepseek/deepseek-v3.2', name: 'DeepSeek V3.2' },
        { id: 'deepseek/deepseek-coder-v2', name: 'DeepSeek Coder V2' },
    ],
  },
    {
    provider: 'openrouter',
    name: 'OpenRouter (xAi)',
    models: [
        { id: 'xai/grok-3', name: 'Grok 3' },
        { id: 'xai/grok-4', name: 'Grok 4' },
    ],
  }
];

export const DEFAULT_PERMISSIONS: AllRolePermissions = {
    admin: {
        canViewDashboard: true,
        canManageUsers: true,
        canManageRoles: true,
        canManageKB: true,
        canViewModelConfig: true,
        canEditModelConfig: true,
        canViewCompanySettings: true,
        canEditCompanySettings: true,
        canViewChatLogs: true,
        canViewSmtpSettings: true,
        canEditSmtpSettings: true,
        canCustomizePanel: true,
        canManageBackups: true,
        canImportUsers: true,
    },
    manager: {
        canViewDashboard: true,
        canManageUsers: true,
        canManageRoles: true,
        canManageKB: true,
        canViewModelConfig: true,
        canEditModelConfig: true,
        canViewCompanySettings: true,
        canEditCompanySettings: true,
        canViewChatLogs: true,
        canViewSmtpSettings: true,
        canEditSmtpSettings: true,
        canCustomizePanel: true,
        canManageBackups: true,
        canImportUsers: true,
    },
    supervisor: {
        canViewDashboard: true,
        canManageUsers: true,
        canManageRoles: false,
        canManageKB: true,
        canViewModelConfig: true,
        canEditModelConfig: false,
        canViewCompanySettings: true,
        canEditCompanySettings: false,
        canViewChatLogs: true,
        canViewSmtpSettings: false,
        canEditSmtpSettings: false,
        canCustomizePanel: false,
        canManageBackups: false,
        canImportUsers: false,
    },
    support: {
        canViewDashboard: true,
        canManageUsers: false,
        canManageRoles: false,
        canManageKB: true,
        canViewModelConfig: false,
        canEditModelConfig: false,
        canViewCompanySettings: false,
        canEditCompanySettings: false,
        canViewChatLogs: true,
        canViewSmtpSettings: false,
        canEditSmtpSettings: false,
        canCustomizePanel: false,
        canManageBackups: false,
        canImportUsers: false,
    },
    client: {
        canViewDashboard: false,
        canManageUsers: false,
        canManageRoles: false,
        canManageKB: false,
        canViewModelConfig: false,
        canEditModelConfig: false,
        canViewCompanySettings: false,
        canEditCompanySettings: false,
        canViewChatLogs: false,
        canViewSmtpSettings: false,
        canEditSmtpSettings: false,
        canCustomizePanel: false,
        canManageBackups: false,
        canImportUsers: false,
    },
};


export const INITIAL_KNOWLEDGE_BASE: KnowledgeEntry[] = [
    {
        id: 'kb-1',
        tag: 'Welcome',
        content: 'Welcome to Atlas AI Support Assistant. Our goal is to provide you with the best support possible.',
        lastUpdated: Date.now(),
        updatedBy: 'system',
    },
    {
        id: 'kb-2',
        tag: 'Hours',
        content: 'Our support hours are from 9 AM to 5 PM, Monday through Friday.',
        lastUpdated: Date.now(),
        updatedBy: 'system',
    },
];