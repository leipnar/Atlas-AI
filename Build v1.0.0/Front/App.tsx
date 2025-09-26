import React, { useState, useEffect, useCallback } from 'react';
import { LandingPage } from './components/LandingPage.tsx';
import { ChatInterface } from './components/ChatInterface.tsx';
import { Header } from './components/Header.tsx';
import { AdminDashboard } from './components/AdminDashboard.tsx';
import * as api from './services/apiService.ts';
import { generateAnswer } from './services/geminiService.ts';
import type { User, ChatMessage, CompanyInfo, ModelConfig, AllRolePermissions } from './types.ts';
import { useTranslation } from './i18n/i18n.tsx';

// The main application component
const App: React.FC = () => {
    const { t } = useTranslation();
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isAuthenticating, setIsAuthenticating] = useState(true);
    const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
    
    // Admin Dashboard State
    const [isAdminDashboardOpen, setIsAdminDashboardOpen] = useState(false);
    const [permissions, setPermissions] = useState<AllRolePermissions | null>(null);
    
    // Chat State
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [modelConfig, setModelConfig] = useState<ModelConfig | null>(null);

    // Initial load: check for current user and fetch essential data
    useEffect(() => {
        const initializeApp = async () => {
            try {
                const [user, companyData, perms, config] = await Promise.all([
                    api.getCurrentUser(),
                    api.getCompanyInfo(),
                    api.getPermissions(),
                    api.getModelConfig()
                ]);

                if (user) {
                    setCurrentUser(user);
                    setPermissions(perms);
                    setModelConfig(config);
                    // Add initial bot message
                    setMessages([
                        { id: 'init', sender: 'atlas', text: t('welcomeMessage'), timestamp: Date.now() }
                    ]);
                }
                setCompanyInfo(companyData);
            } catch (err) {
                console.error("Initialization failed:", err);
                setError("Failed to initialize the application.");
            } finally {
                setIsAuthenticating(false);
            }
        };
        initializeApp();
    }, [t]);

    const handleLogin = async (username: string, password: string) => {
        const result = await api.login(username, password);
        if (result.success && result.user) {
            setCurrentUser(result.user);
            const [perms, config] = await Promise.all([api.getPermissions(), api.getModelConfig()]);
            setPermissions(perms);
            setModelConfig(config);
            setMessages([
                { id: 'init', sender: 'atlas', text: t('welcomeMessage'), timestamp: Date.now() }
            ]);
        }
        return result;
    };

    const handleLogout = async () => {
        await api.logout();
        setCurrentUser(null);
        setMessages([]);
        setIsAdminDashboardOpen(false);
    };

    const handleSendMessage = useCallback(async (text: string) => {
        if (!modelConfig) {
            setError("Model configuration is not loaded.");
            return;
        }

        const userMessage: ChatMessage = {
            id: `msg-${Date.now()}`,
            sender: 'user',
            text,
            timestamp: Date.now(),
        };
        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);
        setError(null);

        try {
            // Get the knowledge base content
            const kbEntries = await api.getKnowledgeBase();
            const knowledgeBaseText = kbEntries.map(e => `[${e.tag}]\n${e.content}`).join('\n\n---\n\n');
            
            const answerText = await generateAnswer(text, knowledgeBaseText, modelConfig);
            
            const atlasMessage: ChatMessage = {
                id: `msg-${Date.now() + 1}`,
                sender: 'atlas',
                text: answerText,
                timestamp: Date.now(),
            };
            setMessages(prev => [...prev, atlasMessage]);

        } catch (err: any) {
            const errorMessage: ChatMessage = {
                id: `err-${Date.now()}`,
                sender: 'atlas',
                text: err.message || t('genericApiError'),
                timestamp: Date.now(),
                isError: true,
            };
            setMessages(prev => [...prev, errorMessage]);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [modelConfig, t]);

    const handleClearChat = () => {
        setMessages([
            { id: 'init', sender: 'atlas', text: t('welcomeMessage'), timestamp: Date.now() }
        ]);
    };
    
    const handleFeedback = async (messageId: string, feedback: 'good' | 'bad') => {
        setMessages(prev => prev.map(msg => msg.id === messageId ? {...msg, feedback} : msg));
        await api.submitFeedback(messageId, feedback); // Fire and forget
    };
    
    const handleUserUpdate = (updatedUser: User) => {
        setCurrentUser(updatedUser);
    };

    const canViewAdminDashboard = currentUser && permissions && permissions[currentUser.role]?.canViewDashboard;

    // Loading screen
    if (isAuthenticating || !companyInfo) {
        return <div className="flex items-center justify-center h-screen bg-slate-100"><p>{t('loadingApplication')}</p></div>;
    }

    // Main render logic
    if (!currentUser) {
        return <LandingPage onLogin={handleLogin} companyInfo={companyInfo} />;
    }
    
    const companyName = companyInfo[t('language') === 'fa' ? 'fa' : 'en'].name;

    return (
        <div className="flex flex-col h-screen bg-gray-100">
            <Header 
                user={currentUser} 
                companyName={companyName}
                onLogout={handleLogout}
                onUserUpdate={handleUserUpdate}
                toggleAdminDashboard={() => setIsAdminDashboardOpen(!isAdminDashboardOpen)}
                showAdminDashboardButton={!!canViewAdminDashboard}
            />
            <main className="flex-grow overflow-hidden">
                <ChatInterface
                    messages={messages}
                    isLoading={isLoading}
                    onSendMessage={handleSendMessage}
                    onClearChat={handleClearChat}
                    onFeedback={handleFeedback}
                    error={error}
                />
            </main>
            {isAdminDashboardOpen && canViewAdminDashboard && (
                <AdminDashboard user={currentUser} onClose={() => setIsAdminDashboardOpen(false)} />
            )}
        </div>
    );
};

export default App;