// Real API service that connects to the Atlas backend server
import type {
  User,
  UserCredentials,
  AllRolePermissions,
  ModelConfig,
  KnowledgeEntry,
  CompanyInfo,
  PanelConfig,
  Conversation,
  ConversationSummary,
  UserRole,
  SmtpConfig,
  BackupSchedule,
  GoogleDriveConfig,
  BackupType,
  ApiKeys,
  CustomOpenRouterModel
} from '../types.ts';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper function for API calls
const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  return response;
};

// ==================== AUTHENTICATION ====================

export const login = async (username: string, password: string): Promise<{ success: boolean; message?: string; user?: UserCredentials }> => {
  try {
    const response = await apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    const data = await response.json();
    if (response.ok && data.success) {
      return { success: true, user: data.user };
    }
    return { success: false, message: data.message || 'Login failed' };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, message: 'Network error' };
  }
};

export const socialLogin = async (provider: 'google' | 'microsoft'): Promise<{ success: boolean, user: UserCredentials}> => {
  try {
    const response = await apiCall('/auth/social-login', {
      method: 'POST',
      body: JSON.stringify({ provider })
    });
    const data = await response.json();
    if (response.ok && data.success) {
      return { success: true, user: data.user };
    }
    throw new Error(data.message || 'Social login failed');
  } catch (error) {
    console.error('Social login error:', error);
    return { success: false, user: {} as UserCredentials };
  }
};

export const logout = async (): Promise<void> => {
  try {
    await apiCall('/auth/logout', { method: 'POST' });
  } catch (error) {
    console.error('Logout error:', error);
  }
};

export const getCurrentUser = async (): Promise<UserCredentials | null> => {
  try {
    const response = await apiCall('/auth/current-user', { method: 'GET' });
    if (!response.ok) return null;
    const data = await response.json();
    return data.user || null;
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
};

export const loginWithPasskey = async (username: string): Promise<{ success: boolean, user?: User, message?: string }> => {
  try {
    const response = await apiCall('/auth/passkey', {
      method: 'POST',
      body: JSON.stringify({ username })
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Passkey login error:', error);
    return { success: false, message: 'Network error' };
  }
};

// ==================== USERS ====================

export const getUsers = async (
  { page = 1, limit = 10, search = '', role }: { page: number, limit: number, search?: string, role?: UserRole }
): Promise<{ users: UserCredentials[], totalPages: number }> => {
  try {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) params.append('search', search);
    if (role) params.append('role', role);

    const response = await apiCall(`/users?${params}`, { method: 'GET' });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Get users error:', error);
    return { users: [], totalPages: 0 };
  }
};

export const getUserCount = async (): Promise<number> => {
  try {
    const response = await apiCall('/stats/user-count', { method: 'GET' });
    const data = await response.json();
    return data.count || 0;
  } catch (error) {
    console.error('Get user count error:', error);
    return 0;
  }
};

export const addUser = async (userData: UserCredentials): Promise<{ success: boolean; message?: string }> => {
  try {
    const response = await apiCall('/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Add user error:', error);
    return { success: false, message: 'Network error' };
  }
};

export const updateUser = async (username: string, updateData: Partial<UserCredentials>): Promise<{ success: boolean; user?: UserCredentials, message?: string }> => {
  try {
    const response = await apiCall(`/users/${username}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Update user error:', error);
    return { success: false, message: 'Network error' };
  }
};

export const deleteUser = async (username: string): Promise<{ success: boolean }> => {
  try {
    const response = await apiCall(`/users/${username}`, { method: 'DELETE' });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Delete user error:', error);
    return { success: false };
  }
};

export const importUsers = async (users: UserCredentials[]): Promise<{ success: boolean, message: string }> => {
  try {
    const response = await apiCall('/users/import', {
      method: 'POST',
      body: JSON.stringify({ users })
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Import users error:', error);
    return { success: false, message: 'Network error' };
  }
};

export const updatePassword = async (username: string, currentPassword: string, newPassword: string): Promise<{ success: boolean, message: string }> => {
  try {
    const response = await apiCall(`/users/${username}/update-password`, {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword })
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Update password error:', error);
    return { success: false, message: 'Network error' };
  }
};

export const registerPasskey = async (username: string): Promise<{ success: boolean }> => {
  try {
    const response = await apiCall(`/users/${username}/register-passkey`, {
      method: 'POST',
      body: JSON.stringify({})
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Register passkey error:', error);
    return { success: false };
  }
};

// ==================== KNOWLEDGE BASE ====================

export const getKnowledgeBase = async (): Promise<KnowledgeEntry[]> => {
  try {
    const response = await apiCall('/knowledge-base', { method: 'GET' });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Get knowledge base error:', error);
    return [];
  }
};

export const addKnowledgeEntry = async (entry: Omit<KnowledgeEntry, '_id' | 'lastUpdated'>): Promise<{ success: boolean; entry?: KnowledgeEntry }> => {
  try {
    const response = await apiCall('/knowledge-base', {
      method: 'POST',
      body: JSON.stringify(entry)
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Add knowledge entry error:', error);
    return { success: false };
  }
};

export const updateKnowledgeEntry = async (id: string, entry: Partial<KnowledgeEntry>): Promise<{ success: boolean }> => {
  try {
    const response = await apiCall(`/knowledge-base/${id}`, {
      method: 'PUT',
      body: JSON.stringify(entry)
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Update knowledge entry error:', error);
    return { success: false };
  }
};

export const deleteKnowledgeEntry = async (id: string): Promise<{ success: boolean }> => {
  try {
    const response = await apiCall(`/knowledge-base/${id}`, { method: 'DELETE' });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Delete knowledge entry error:', error);
    return { success: false };
  }
};

// ==================== CONFIGURATION ====================

export const getPermissions = async (): Promise<AllRolePermissions> => {
  try {
    const response = await apiCall('/config/permissions', { method: 'GET' });
    return await response.json();
  } catch (error) {
    console.error('Get permissions error:', error);
    return {} as AllRolePermissions;
  }
};

export const updatePermissions = async (permissions: AllRolePermissions): Promise<{ success: boolean }> => {
  try {
    const response = await apiCall('/config/permissions', {
      method: 'PUT',
      body: JSON.stringify(permissions)
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Update permissions error:', error);
    return { success: false };
  }
};

export const getModelConfig = async (): Promise<ModelConfig> => {
  try {
    const response = await apiCall('/config/model', { method: 'GET' });
    return await response.json();
  } catch (error) {
    console.error('Get model config error:', error);
    return { provider: 'google', model: 'gemini-2.5-flash', temperature: 0.7, topP: 0.9, topK: 40, customInstruction: '' };
  }
};

export const updateModelConfig = async (config: ModelConfig): Promise<{ success: boolean }> => {
  try {
    const response = await apiCall('/config/model', {
      method: 'PUT',
      body: JSON.stringify(config)
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Update model config error:', error);
    return { success: false };
  }
};

export const getCompanyInfo = async (): Promise<CompanyInfo> => {
  try {
    const response = await apiCall('/config/company', { method: 'GET' });
    return await response.json();
  } catch (error) {
    console.error('Error fetching company info:', error);
    return {
      logo: null,
      en: { name: 'Atlas Corp.', about: 'Welcome to the Atlas AI Assistant.' },
      fa: { name: 'شرکت اطلس', about: 'به دستیار هوش مصنوعی اطلس خوش آمدید.' }
    };
  }
};

export const updateCompanyInfo = async (info: CompanyInfo): Promise<{ success: boolean }> => {
  try {
    const response = await apiCall('/config/company', {
      method: 'PUT',
      body: JSON.stringify(info)
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating company info:', error);
    return { success: false };
  }
};

export const getPanelConfig = async (): Promise<PanelConfig> => {
  try {
    const response = await apiCall('/config/panel', { method: 'GET' });
    return await response.json();
  } catch (error) {
    console.error('Error fetching panel config:', error);
    return {
      aiNameEn: 'Atlas',
      aiNameFa: 'اطلس',
      chatHeaderTitleEn: 'Conversation with Atlas',
      chatHeaderTitleFa: 'گفتگو با اطلس',
      chatPlaceholderEn: 'Type your message here...',
      chatPlaceholderFa: 'پیام خود را اینجا بنویسید...',
      welcomeMessageEn: 'Hello! How can I help you today?',
      welcomeMessageFa: 'سلام! چطور می‌توانم امروز به شما کمک کنم؟',
      aiAvatar: null,
      privacyPolicyEn: 'This is the default Privacy Policy.',
      privacyPolicyFa: 'این متن پیش‌فرض سیاست حفظ حریم خصوصی است.',
      termsOfServiceEn: 'These are the default Terms of Service.',
      termsOfServiceFa: 'این متن پیش‌فرض شرایط خدمات است.'
    };
  }
};

export const updatePanelConfig = async (config: PanelConfig): Promise<{ success: boolean }> => {
  try {
    const response = await apiCall('/config/panel', {
      method: 'PUT',
      body: JSON.stringify(config)
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating panel config:', error);
    return { success: false };
  }
};

export const getSmtpConfig = async (): Promise<SmtpConfig> => {
  try {
    const response = await apiCall('/config/smtp', { method: 'GET' });
    return await response.json();
  } catch (error) {
    console.error('Get SMTP config error:', error);
    return { host: '', port: 587, secure: false, username: '', password: '', fromEmail: '', fromName: '' };
  }
};

export const updateSmtpConfig = async (config: SmtpConfig): Promise<{ success: boolean }> => {
  try {
    const response = await apiCall('/config/smtp', {
      method: 'PUT',
      body: JSON.stringify(config)
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Update SMTP config error:', error);
    return { success: false };
  }
};

export const getApiKeys = async (): Promise<ApiKeys> => {
  try {
    const response = await apiCall('/config/api-keys', { method: 'GET' });
    return await response.json();
  } catch (error) {
    console.error('Get API keys error:', error);
    return { googleApiKey: '', openAiKey: '', openRouterKey: '' };
  }
};

export const saveApiKeys = async (keys: ApiKeys): Promise<{ success: boolean }> => {
  try {
    const response = await apiCall('/config/api-keys', {
      method: 'POST',
      body: JSON.stringify(keys)
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Save API keys error:', error);
    return { success: false };
  }
};

export const getCustomModels = async (): Promise<CustomOpenRouterModel[]> => {
  try {
    const response = await apiCall('/config/custom-models', { method: 'GET' });
    return await response.json();
  } catch (error) {
    console.error('Get custom models error:', error);
    return [];
  }
};

export const addCustomModel = async (model: CustomOpenRouterModel): Promise<{ success: boolean; model?: CustomOpenRouterModel }> => {
  try {
    const response = await apiCall('/config/custom-models', {
      method: 'POST',
      body: JSON.stringify(model)
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Add custom model error:', error);
    return { success: false };
  }
};

export const updateCustomModel = async (id: string, model: CustomOpenRouterModel): Promise<{ success: boolean }> => {
  try {
    const response = await apiCall(`/config/custom-models/${id}`, {
      method: 'PUT',
      body: JSON.stringify(model)
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Update custom model error:', error);
    return { success: false };
  }
};

export const deleteCustomModel = async (id: string): Promise<{ success: boolean }> => {
  try {
    const response = await apiCall(`/config/custom-models/${id}`, { method: 'DELETE' });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Delete custom model error:', error);
    return { success: false };
  }
};

// ==================== CHAT & CONVERSATIONS ====================

export const getConversationSummaries = async (): Promise<ConversationSummary[]> => {
  try {
    const response = await apiCall('/chat/conversations', { method: 'GET' });
    return await response.json();
  } catch (error) {
    console.error('Get conversation summaries error:', error);
    return [];
  }
};

export const getConversation = async (conversationId: string): Promise<Conversation | null> => {
  try {
    const response = await apiCall(`/chat/conversations/${conversationId}`, { method: 'GET' });
    return await response.json();
  } catch (error) {
    console.error('Get conversation error:', error);
    return null;
  }
};

export const createConversation = async (): Promise<Conversation> => {
  try {
    const response = await apiCall('/chat/conversations', {
      method: 'POST',
      body: JSON.stringify({})
    });
    return await response.json();
  } catch (error) {
    console.error('Create conversation error:', error);
    throw error;
  }
};

export const addMessageToConversation = async (conversationId: string, message: any): Promise<{ success: boolean }> => {
  try {
    const response = await apiCall(`/chat/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify(message)
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Add message error:', error);
    return { success: false };
  }
};

export const getChatLogs = async (): Promise<Conversation[]> => {
  try {
    const response = await apiCall('/chat/logs', { method: 'GET' });
    return await response.json();
  } catch (error) {
    console.error('Get chat logs error:', error);
    return [];
  }
};

export const deleteChatLog = async (conversationId: string): Promise<{ success: boolean }> => {
  try {
    const response = await apiCall(`/chat/logs/${conversationId}`, { method: 'DELETE' });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Delete chat log error:', error);
    return { success: false };
  }
};

// ==================== STATISTICS ====================

export const getUserRoleDistribution = async (): Promise<Record<UserRole, number>> => {
  try {
    const response = await apiCall('/stats/user-role-distribution', { method: 'GET' });
    return await response.json();
  } catch (error) {
    console.error('Get user role distribution error:', error);
    return {} as Record<UserRole, number>;
  }
};

export const getChatActivity = async (): Promise<{ date: string; count: number }[]> => {
  try {
    const response = await apiCall('/stats/chat-activity', { method: 'GET' });
    return await response.json();
  } catch (error) {
    console.error('Get chat activity error:', error);
    return [];
  }
};

export const getKnowledgeBaseStats = async (): Promise<{ totalEntries: number; lastUpdated: string }> => {
  try {
    const response = await apiCall('/stats/knowledge-base', { method: 'GET' });
    return await response.json();
  } catch (error) {
    console.error('Get KB stats error:', error);
    return { totalEntries: 0, lastUpdated: new Date().toISOString() };
  }
};

// ==================== BACKUP & RESTORE ====================

export const exportData = async (type: BackupType): Promise<Blob> => {
  try {
    const response = await apiCall(`/backup/export?type=${type}`, { method: 'GET' });
    return await response.blob();
  } catch (error) {
    console.error('Export data error:', error);
    throw error;
  }
};

export const importData = async (type: BackupType, file: File): Promise<{ success: boolean; message: string }> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    const response = await fetch(`${API_URL}/backup/import`, {
      method: 'POST',
      credentials: 'include',
      body: formData
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Import data error:', error);
    return { success: false, message: 'Network error' };
  }
};

export const getBackupSchedule = async (): Promise<BackupSchedule> => {
  try {
    const response = await apiCall('/backup/schedule', { method: 'GET' });
    return await response.json();
  } catch (error) {
    console.error('Get backup schedule error:', error);
    return { enabled: false, frequency: 'daily', time: '02:00', destination: 'local' };
  }
};

export const updateBackupSchedule = async (schedule: BackupSchedule): Promise<{ success: boolean }> => {
  try {
    const response = await apiCall('/backup/schedule', {
      method: 'PUT',
      body: JSON.stringify(schedule)
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Update backup schedule error:', error);
    return { success: false };
  }
};

export const getGoogleDriveConfig = async (): Promise<GoogleDriveConfig> => {
  try {
    const response = await apiCall('/backup/google-drive', { method: 'GET' });
    return await response.json();
  } catch (error) {
    console.error('Get Google Drive config error:', error);
    return { enabled: false, folderId: '', credentials: null };
  }
};

export const updateGoogleDriveConfig = async (config: GoogleDriveConfig): Promise<{ success: boolean }> => {
  try {
    const response = await apiCall('/backup/google-drive', {
      method: 'PUT',
      body: JSON.stringify(config)
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Update Google Drive config error:', error);
    return { success: false };
  }
};

// Deprecated/unused functions kept for compatibility
export const resetUserPassword = async (username: string, newPass: string): Promise<{ success: boolean, message: string }> => {
  return updatePassword(username, '', newPass);
};

// Additional compatibility functions
export const getCustomOpenRouterModels = async () => getCustomModels();
export const addCustomOpenRouterModel = async (model: CustomOpenRouterModel) => addCustomModel(model);
export const updateCustomOpenRouterModel = async (id: string, model: CustomOpenRouterModel) => updateCustomModel(id, model);
export const deleteCustomOpenRouterModel = async (id: string) => deleteCustomModel(id);
export const setApiKeys = async (keys: ApiKeys) => saveApiKeys(keys);

export const testSmtpConnection = async (config: SmtpConfig): Promise<{ success: boolean; message: string }> => {
  // Mock implementation - backend doesn't have this endpoint yet
  return { success: true, message: 'Connection test successful' };
};

export const getBackupData = async (type: BackupType) => exportData(type);
export const restoreBackupData = async (type: BackupType, file: File) => importData(type, file);

export const connectGoogleDrive = async () => {
  return { success: true, message: 'Google Drive connection not implemented' };
};

export const disconnectGoogleDrive = async () => {
  return { success: true };
};

export const getChatLogCount = async (): Promise<number> => {
  try {
    const response = await apiCall('/stats/chat-log-count', { method: 'GET' });
    const data = await response.json();
    return data.count || 0;
  } catch (error) {
    console.error('Get chat log count error:', error);
    return 0;
  }
};

export const getKbEntryCount = async (): Promise<number> => {
  try {
    const kb = await getKnowledgeBase();
    return kb.length;
  } catch (error) {
    console.error('Get KB entry count error:', error);
    return 0;
  }
};

export const getFeedbackStats = async () => {
  return { good: 0, bad: 0, total: 0 };
};

export const getUnansweredQuestionsCount = async (): Promise<number> => {
  return 0;
};

export const getChatVolumeByHour = async () => {
  return [];
};

export const submitFeedback = async (conversationId: string, messageIndex: number, feedback: 'good' | 'bad'): Promise<{ success: boolean }> => {
  try {
    const response = await apiCall(`/chat/conversations/${conversationId}/feedback`, {
      method: 'POST',
      body: JSON.stringify({ messageIndex, feedback })
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Submit feedback error:', error);
    return { success: false };
  }
};
