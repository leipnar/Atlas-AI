import type { User, UserCredentials, ConversationSummary, Conversation, KnowledgeEntry, UserRole, AllRolePermissions, CompanyInfo, SmtpConfig, ModelConfig } from './types.ts';
import { INITIAL_KNOWLEDGE_BASE, DEFAULT_PERMISSIONS, DEFAULT_MODEL } from '../constants.ts';

// --- MOCK DATA ---
const initialUsers: UserCredentials[] = [
  { username: 'admin', firstName: 'Admin', lastName: 'User', role: 'admin', email: 'admin@atlas.com', mobile: '555-0101', password: 'PassWD', emailVerified: true, ip: '192.168.1.1', device: 'Desktop', os: 'Windows' },
  { username: 'manager', firstName: 'Manager', lastName: 'Person', role: 'manager', email: 'manager@atlas.com', mobile: '555-0102', password: 'PassWD', emailVerified: true, ip: '192.168.1.2', device: 'Laptop', os: 'macOS' },
  { username: 'supervisor', firstName: 'Super', lastName: 'Visor', role: 'supervisor', email: 'super@atlas.com', mobile: '555-0103', password: 'PassWD', emailVerified: true, ip: '192.168.1.3', device: 'Desktop', os: 'Windows' },
  { username: 'support', firstName: 'Support', lastName: 'Staff', role: 'support', email: 'support@atlas.com', mobile: '555-0104', password: 'PassWD', emailVerified: false, ip: '192.168.1.4', device: 'Tablet', os: 'Android' },
  { username: 'client', firstName: 'Client', lastName: 'Joe', role: 'client', email: 'client@atlas.com', mobile: '555-0105', password: 'PassWD', emailVerified: true, ip: '192.168.1.5', device: 'Mobile', os: 'iOS' },
  { username: 'testuser', firstName: 'Test', lastName: 'Account', role: 'client', email: 'test@atlas.com', mobile: '555-0106', password: 'PassWD', emailVerified: false, ip: '192.168.1.6', device: 'Mobile', os: 'Android' },
];

const initialConversations: Conversation[] = [
    { 
        id: 'log1', 
        user: initialUsers[4], // Client Joe
        startTime: Date.now() - 86400000, 
        messageCount: 2, 
        firstMessage: 'What is Atlas?',
        messages: [
            { id: 'm1', sender: 'user', text: 'What is Atlas?', timestamp: Date.now() - 86400000 },
            { id: 'm2', sender: 'atlas', text: 'Atlas is an AI assistant designed to answer questions based on a specific set of information.', timestamp: Date.now() - 86300000 }
        ]
    },
];

const initialCompanyInfo: CompanyInfo = {
    en: {
        name: "Atlas AI",
        about: "An intelligent AI support assistant that answers questions based on a provided knowledge base, ensuring responses are accurate and contextually grounded.",
    },
    fa: {
        name: "هوش مصنوعی اطلس",
        about: "یک دستیار پشتیبانی هوشمند مبتنی بر هوش مصنوعی که به سوالات بر اساس پایگاه دانش ارائه شده پاسخ می‌دهد و از صحت و مبتنی بر زمینه بودن پاسخ‌ها اطمینان حاصل می‌کند.",
    },
    logo: null,
};

const initialSmtpConfig: SmtpConfig = {
    host: 'smtp.example.com',
    port: 587,
    secure: false,
    username: 'user@example.com',
    password: '',
};

const initialModelConfig: ModelConfig = {
    model: DEFAULT_MODEL,
    // Fix: Added missing customInstruction property to align with the ModelConfig type.
    customInstruction: 'The assistant should be friendly, professional, and concise in its answers.',
    temperature: 0.2,
    topP: 0.8,
    topK: 40,
};

// --- API SIMULATION ---
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

const getStore = <T>(key: string, initialData: T): T => {
    try {
        const item = sessionStorage.getItem(key);
        return item ? JSON.parse(item) : initialData;
    } catch (error) {
        return initialData;
    }
};

const setStore = <T>(key: string, data: T) => {
    sessionStorage.setItem(key, JSON.stringify(data));
};

// Initialize stores
let users = getStore('api_users', initialUsers);
let knowledgeBase = getStore('api_kb_structured', INITIAL_KNOWLEDGE_BASE);
let conversations = getStore('api_conversations', initialConversations);
let permissions = getStore('api_permissions', DEFAULT_PERMISSIONS);
let apiKey = getStore('api_key', '');
let companyInfo = getStore('api_company_info', initialCompanyInfo);
let smtpConfig = getStore('api_smtp_config', initialSmtpConfig);
let modelConfig = getStore('api_model_config', initialModelConfig);


// --- AUTH ---
export const login = async (username: string, password: string): Promise<{ success: boolean; message?: string; user?: User }> => {
    await delay(500);
    const user = users.find(u => u.username === username);
    if (user && user.password === password) {
        const userSession: User = { username: user.username, firstName: user.firstName, lastName: user.lastName, role: user.role };
        sessionStorage.setItem('currentUser', JSON.stringify(userSession));
        return { success: true, user: userSession };
    }
    return { success: false, message: 'Invalid username or password.' };
};
export const logout = async (): Promise<void> => {
    await delay(200);
    sessionStorage.removeItem('currentUser');
};
export const getCurrentUser = async (): Promise<User | null> => {
    await delay(50);
    return getStore('currentUser', null);
};

// --- USER & ACCOUNT ---
export const updatePassword = async (username: string, oldPass: string, newPass: string): Promise<{success: boolean, message: string}> => {
    await delay(500);
    const userIdx = users.findIndex(u => u.username === username);
    if (userIdx === -1 || users[userIdx].password !== oldPass) {
        return { success: false, message: "Current password is incorrect." };
    }
    users[userIdx].password = newPass;
    setStore('api_users', users);
    return { success: true, message: "Password updated successfully." };
};

export const resetUserPassword = async (username: string, newPass: string): Promise<{success: boolean, message: string}> => {
    await delay(500);
    const userIdx = users.findIndex(u => u.username === username);
    if (userIdx === -1) {
        return { success: false, message: "User not found." };
    }
    users[userIdx].password = newPass;
    setStore('api_users', users);
    return { success: true, message: `Password for ${username} has been reset.` };
};

export const resendVerificationEmail = async (username: string): Promise<{success: boolean, message: string}> => {
    await delay(600);
    console.log(`SIMULATION: Sent verification email to user ${username}.`);
    return { success: true, message: `Verification email sent to ${username}.` };
};

export const getUsers = async (options: { page: number, limit: number, search?: string, role?: UserRole | 'all' }): Promise<{ users: UserCredentials[], totalPages: number }> => {
    await delay(400);
    // Hide admin user from all lists
    let filteredUsers = users.filter(u => u.username !== 'admin');
    if (options.role && options.role !== 'all') {
        filteredUsers = filteredUsers.filter(u => u.role === options.role);
    }
    if (options.search) {
        const q = options.search.toLowerCase();
        filteredUsers = filteredUsers.filter(u => u.username.toLowerCase().includes(q) || u.firstName.toLowerCase().includes(q) || u.lastName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }
    const totalPages = Math.ceil(filteredUsers.length / options.limit);
    const paginatedUsers = filteredUsers.slice((options.page - 1) * options.limit, options.page * options.limit);
    return { users: paginatedUsers, totalPages };
};
export const addUser = async (user: UserCredentials): Promise<{success: boolean, message?: string}> => {
    await delay(300);
    if (users.some(u => u.username === user.username)) {
        return { success: false, message: `Username "${user.username}" already exists.`};
    }
    users.push({ ...user, ip: 'N/A', device: 'N/A', os: 'N/A', emailVerified: false });
    setStore('api_users', users);
    return { success: true };
};
export const updateUser = async (username: string, userData: Partial<UserCredentials>): Promise<{success: boolean, message?: string, user?: User}> => {
    await delay(300);
    const userIdx = users.findIndex(u => u.username === username);
    if (userIdx === -1) return { success: false, message: "User not found."};
    
    const updatedPassword = userData.password ? userData.password : users[userIdx].password;
    users[userIdx] = { ...users[userIdx], ...userData, password: updatedPassword };
    setStore('api_users', users);

    // If updating the current user, update their session
    const currentUser = getStore<User | null>('currentUser', null);
    if(currentUser && currentUser.username === username) {
        const userSession: User = { username: users[userIdx].username, firstName: users[userIdx].firstName, lastName: users[userIdx].lastName, role: users[userIdx].role };
        sessionStorage.setItem('currentUser', JSON.stringify(userSession));
        return { success: true, user: userSession };
    }

    return { success: true };
};
export const deleteUser = async (username: string): Promise<{success: boolean}> => {
    await delay(300);
    users = users.filter(u => u.username !== username);
    setStore('api_users', users);
    return { success: true };
};

// --- KNOWLEDGE BASE ---
export const getKnowledgeBase = async (): Promise<KnowledgeEntry[]> => {
    await delay(200);
    return knowledgeBase;
};
export const addKnowledgeEntry = async (entry: Omit<KnowledgeEntry, 'id'>): Promise<KnowledgeEntry> => {
    await delay(200);
    const newEntry: KnowledgeEntry = { ...entry, id: `kb-${Date.now()}`};
    knowledgeBase.push(newEntry);
    setStore('api_kb_structured', knowledgeBase);
    return newEntry;
};
export const updateKnowledgeEntry = async (entry: KnowledgeEntry): Promise<KnowledgeEntry> => {
    await delay(200);
    const index = knowledgeBase.findIndex(e => e.id === entry.id);
    if (index > -1) {
        knowledgeBase[index] = entry;
        setStore('api_kb_structured', knowledgeBase);
        return entry;
    }
    throw new Error("Entry not found");
};
export const deleteKnowledgeEntry = async (id: string): Promise<{success: boolean}> => {
    await delay(200);
    knowledgeBase = knowledgeBase.filter(e => e.id !== id);
    setStore('api_kb_structured', knowledgeBase);
    return { success: true };
};


// --- LOGS ---
export const getChatLogs = async (options: { page: number, limit: number, search?: string }): Promise<{ logs: ConversationSummary[], totalPages: number }> => {
    await delay(400);
    let filteredLogs = conversations;
    if (options.search) {
        const q = options.search.toLowerCase();
        filteredLogs = filteredLogs.filter(c => c.user.username.toLowerCase().includes(q) || c.user.firstName.toLowerCase().includes(q) || c.user.lastName.toLowerCase().includes(q));
    }
    const sortedLogs = [...filteredLogs].sort((a, b) => b.startTime - a.startTime);
    const totalPages = Math.ceil(sortedLogs.length / options.limit);
    const paginatedLogs = sortedLogs.slice((options.page - 1) * options.limit, options.page * options.limit);
    const summaries: ConversationSummary[] = paginatedLogs.map(({messages, ...summary}) => summary);
    return { logs: summaries, totalPages };
};
export const getConversation = async (id: string): Promise<Conversation | null> => {
    await delay(200);
    return conversations.find(c => c.id === id) || null;
};

// --- PERMISSIONS & CONFIG ---
export const getPermissions = async (): Promise<AllRolePermissions> => {
    await delay(100);
    return permissions;
};
export const updatePermissions = async (newPermissions: AllRolePermissions): Promise<{success: boolean}> => {
    await delay(300);
    permissions = newPermissions;
    setStore('api_permissions', permissions);
    return { success: true };
};
export const getApiKey = async (): Promise<string | null> => {
    await delay(50);
    return apiKey;
};
export const isApiKeySet = async (): Promise<boolean> => {
    await delay(50);
    return !!apiKey;
};
export const setApiKey = async (newKey: string): Promise<{success: boolean}> => {
    await delay(200);
    apiKey = newKey;
    setStore('api_key', apiKey);
    return { success: true };
};

// --- MODEL CONFIG ---
export const getModelConfig = async (): Promise<ModelConfig> => {
    await delay(50);
    return modelConfig;
};

export const updateModelConfig = async (newConfig: ModelConfig): Promise<{success: boolean}> => {
    await delay(300);
    modelConfig = newConfig;
    setStore('api_model_config', modelConfig);
    return { success: true };
};


// --- COMPANY INFO ---
export const getCompanyInfo = async (): Promise<CompanyInfo> => {
    await delay(50);
    return companyInfo;
};

export const updateCompanyInfo = async (newInfo: CompanyInfo): Promise<{success: boolean}> => {
    await delay(300);
    companyInfo = newInfo;
    setStore('api_company_info', companyInfo);
    return { success: true };
};

// --- SMTP CONFIG ---
export const getSmtpConfig = async(): Promise<SmtpConfig> => {
    await delay(100);
    const { password, ...config } = smtpConfig; // Don't return password
    return config;
};

export const updateSmtpConfig = async(newConfig: SmtpConfig): Promise<{success: boolean}> => {
    await delay(300);
    smtpConfig = { ...smtpConfig, ...newConfig };
    setStore('api_smtp_config', smtpConfig);
    return { success: true };
};

// --- FEEDBACK ---
export const submitFeedback = async (messageId: string, feedback: 'good' | 'bad'): Promise<{success: boolean}> => {
    await delay(300);
    // In a real app, this would send the feedback to a database.
    console.log(`Feedback submitted for message ${messageId}: ${feedback}`);
    // Simulate it always succeeds
    return { success: true };
};

// --- PASSKEY (Simulation) ---
export const registerPasskey = async (username: string): Promise<{success: boolean, message?: string}> => {
    await delay(1000);
    console.log(`Simulating passkey registration for ${username}`);
    return { success: true };
}
export const loginWithPasskey = async (username: string): Promise<{success: boolean, message?: string, user?: User}> => {
    await delay(1000);
    const user = users.find(u => u.username === username);
    if (user) {
        console.log(`Simulating passkey login for ${username}`);
        const userSession: User = { username: user.username, firstName: user.firstName, lastName: user.lastName, role: user.role };
        sessionStorage.setItem('currentUser', JSON.stringify(userSession));
        return { success: true, user: userSession };
    }
    return { success: false, message: "User not found for passkey login."};
}