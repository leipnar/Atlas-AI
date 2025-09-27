import type { ModelGroup, SupportedModel, UserRole, KnowledgeEntry, AllRolePermissions } from './types.ts';

export const AVAILABLE_MODELS: ModelGroup[] = [
    {
        provider: 'Google',
        models: [
            {
                id: 'gemini-2.5-flash',
                name: 'Gemini 2.5 Flash',
                description: 'A powerful, multimodal model for a variety of use cases.',
            },
        ],
    },
    {
        provider: 'OpenAI',
        models: [
            {
                id: 'gpt-4o',
                name: 'GPT-4o',
                description: 'The latest and most advanced model from OpenAI.',
            },
        ],
    },
    {
        provider: 'Meta',
        models: [
            {
                id: 'llama3-70b',
                name: 'Llama 3 70B',
                description: 'The largest and most capable Llama 3 model.',
            },
        ],
    },
];

export const DEFAULT_MODEL: SupportedModel = 'gemini-2.5-flash';

export const USER_ROLES: UserRole[] = ['admin', 'manager', 'supervisor', 'support', 'client'];

export const INITIAL_KNOWLEDGE_BASE: KnowledgeEntry[] = [
    {
        id: 'kb-1',
        tag: 'Welcome',
        content: 'Welcome to Atlas! This is a default knowledge base. You can edit this text to provide Atlas with the information it needs to answer questions.',
        lastUpdated: Date.now(),
        updatedBy: 'system',
    },
    {
        id: 'kb-2',
        tag: 'What is Atlas?',
        content: "Atlas is an AI assistant designed to answer questions based on a specific set of information provided by administrators. It does not use external knowledge from the internet.",
        lastUpdated: Date.now(),
        updatedBy: 'system',
    },
    {
        id: 'kb-3',
        tag: 'How Atlas Works',
        content: "1. Administrators provide a knowledge base (like these entries).\n2. Users ask questions in the chat interface.\n3. Atlas uses its language model to find and formulate answers based *only* on the knowledge base.\n4. If an answer isn't in the knowledge base, Atlas will say so.",
        lastUpdated: Date.now(),
        updatedBy: 'system',
    }
];

export const DEFAULT_PERMISSIONS: AllRolePermissions = {
    admin: {
        canViewDashboard: true,
        canManageUsers: true,
        canManageKnowledgeBase: true,
        canViewChatLogs: true,
        canManageRoles: true,
        canConfigureModel: true,
        canManageCompanyInfo: true,
        canConfigureSmtp: true,
    },
    manager: {
        canViewDashboard: true,
        canManageUsers: true,
        canManageKnowledgeBase: true,
        canViewChatLogs: true,
        canManageRoles: true,
        canConfigureModel: true,
        canManageCompanyInfo: true,
        canConfigureSmtp: true,
    },
    supervisor: {
        canViewDashboard: true,
        canManageUsers: true,
        canManageKnowledgeBase: true,
        canViewChatLogs: true,
        canManageRoles: false,
        canConfigureModel: false,
        canManageCompanyInfo: false,
        canConfigureSmtp: false,
    },
    support: {
        canViewDashboard: true,
        canManageUsers: true,
        canManageKnowledgeBase: true,
        canViewChatLogs: false,
        canManageRoles: false,
        canConfigureModel: false,
        canManageCompanyInfo: false,
        canConfigureSmtp: false,
    },
    client: {
        canViewDashboard: false,
        canManageUsers: false,
        canManageKnowledgeBase: false,
        canViewChatLogs: false,
        canManageRoles: false,
        canConfigureModel: false,
        canManageCompanyInfo: false,
        canConfigureSmtp: false,
    }
};