

import React, { useState, useEffect, useCallback } from 'react';
// FIX: Removed .tsx extension from import paths to fix module resolution errors.
import { LandingPage } from './components/LandingPage';
// FIX: Removed .tsx extension from import paths to fix module resolution errors.
import { ChatInterface } from './components/ChatInterface';
// FIX: Removed .tsx extension from import paths to fix module resolution errors.
import { Header } from './components/Header';
// FIX: Removed .tsx extension from import paths to fix module resolution errors.
import { Footer } from './components/Footer';
// FIX: Removed .tsx extension from import paths to fix module resolution errors.
import { AdminDashboard } from './components/AdminDashboard';
// FIX: Removed .ts extension from import paths to fix module resolution errors.
import * as api from './services/apiService';
// FIX: Removed .ts extension from import paths to fix module resolution errors.
import { generateAnswer } from './services/geminiService';
// FIX: Removed .ts extension from import paths to fix module resolution errors.
import type { User, ChatMessage, CompanyInfo, ModelConfig, AllRolePermissions, PanelConfig, UserCredentials, DashboardSection } from './types';
// FIX: Removed .tsx extension from import paths to fix module resolution errors.
import { useTranslation } from './i18n/i18n';
// FIX: Added import for the new LegalPage component.
import { LegalPage } from './components/LegalPage';

const MobileVerificationModal: React.FC<{
    isOpen: boolean;
    onSave: (mobile: string) => Promise<{success: boolean; message?: string}>;
}> = ({ isOpen, onSave }) => {
    const { t } = useTranslation();
    const [mobile, setMobile] = useState('');
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSave = async () => {
        if (!mobile.trim()) {
            setError("Mobile number cannot be empty.");
            return;
        }
        const result = await onSave(mobile);
        if (!result.success) {
            setError(result.message || "Failed to save mobile number.");
        }
    };
    
    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-80 flex items-center justify-center z-[70]">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm m-4 text-start">
                <h2 className="text-xl font-bold text-gray-800 mb-4">{t('mobileVerificationTitle')}</h2>
                <p className="text-gray-600 mb-4">{t('mobileVerificationPrompt')}</p>
                <div>
                    <label htmlFor="mobile-verify" className="block text-sm font-medium text-gray-700 mb-1">{t('mobile')}</label>
                    <input id="mobile-verify" type="tel" value={mobile} onChange={(e) => setMobile(e.target.value)} required className="w-full bg-gray-50 border border-gray-300 rounded-md p-2 text-sm text-black"/>
                </div>
                {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
                <div className="mt-6 text-end">
                    <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-sm">{t('saveMobileNumber')}</button>
                </div>
            </div>
        </div>
    );
};

type View = 'landing' | 'chat' | 'admin' | 'privacy' | 'terms';

// The main application component
const App: React.FC = () => {
    const { t, language } = useTranslation();
    const [currentUser, setCurrentUser] = useState<UserCredentials | null>(null);
    const [isAuthenticating, setIsAuthenticating] = useState(true);
    const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
    const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);
    
    // View Management State
    // FIX: Replaced view and previousView state with a viewStack for robust navigation history.
    const [viewStack, setViewStack] = useState<View[]>(['landing']);
    const currentView = viewStack[viewStack.length - 1];

    // Navigation helpers
    const navigateTo = (newView: View) => setViewStack(prev => [...prev, newView]);
    const goBack = () => {
        if (viewStack.length > 1) {
            setViewStack(prev => prev.slice(0, -1));
        }
    };
    const navigateAndReset = (newView: View) => setViewStack([newView]);

    // Admin Dashboard State
    const [adminSection, setAdminSection] = useState<DashboardSection>('dashboard');
    const [isMobileAdminSidebarOpen, setMobileAdminSidebarOpen] = useState(false);
    const [permissions, setPermissions] = useState<AllRolePermissions | null>(null);
    
    // Chat State
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [modelConfig, setModelConfig] = useState<ModelConfig | null>(null);
    const [panelConfig, setPanelConfig] = useState<PanelConfig | null>(null);

    const setInitialMessage = useCallback((config: PanelConfig | null) => {
        const customWelcome = language === 'fa' ? config?.welcomeMessageFa : config?.welcomeMessageEn;
        const welcomeText = customWelcome || t('welcomeMessage');
        setMessages([
            { id: 'init', sender: 'atlas', text: welcomeText, timestamp: Date.now() }
        ]);
    }, [language, t]);

    const postLoginSetup = useCallback(async (user: UserCredentials) => {
        setCurrentUser(user);

        // Check for mobile number
        if (!user.mobile) {
            setIsMobileModalOpen(true);
        }

        const [perms, config, panelCfg] = await Promise.all([api.getPermissions(), api.getModelConfig(), api.getPanelConfig()]);
        setPermissions(perms);
        setModelConfig(config);
        setPanelConfig(panelCfg);
        setInitialMessage(panelCfg);

        // Dashboard-first logic for staff
        if (user.role !== 'client' && perms[user.role]?.canViewDashboard) {
            // FIX: Set view stack to allow going "back" to chat from initial admin view.
            setViewStack(['chat', 'admin']);
            setAdminSection('dashboard');
        } else {
            // FIX: Use navigation helper.
            navigateAndReset('chat');
        }
    }, [setInitialMessage]);

    // Initial load: check for current user and fetch essential data
    useEffect(() => {
        const initializeApp = async () => {
            try {
                // FIX: Fetch company info and panel config for all users (logged-in or not)
                // to ensure legal pages are accessible from the landing page.
                const [user, companyData, panelCfg] = await Promise.all([
                    api.getCurrentUser(),
                    api.getCompanyInfo(),
                    api.getPanelConfig(),
                ]);
                setCompanyInfo(companyData);
                setPanelConfig(panelCfg);

                if (user) {
                    // postLoginSetup will re-fetch its own data to ensure everything is fresh
                    // after a potential login, which is fine as it's a fast mock API.
                    await postLoginSetup(user);
                } else {
                    // FIX: Use navigation helper.
                    navigateAndReset('landing');
                }
            } catch (err) {
                console.error("Initialization failed:", err);
                setError("Failed to initialize the application.");
            } finally {
                setIsAuthenticating(false);
            }
        };
        initializeApp();
    }, [postLoginSetup]);

    const handleLogin = async (username: string, password: string) => {
        const result = await api.login(username, password);
        if (result.success && result.user) {
            await postLoginSetup(result.user);
        }
        return result;
    };
    
    const handleSocialLogin = async (provider: 'google' | 'microsoft') => {
        const result = await api.socialLogin(provider);
        if (result.success && result.user) {
            await postLoginSetup(result.user);
        }
        return result;
    }

    const handleLogout = async () => {
        await api.logout();
        setCurrentUser(null);
        setMessages([]);
        // FIX: Use navigation helper.
        navigateAndReset('landing');
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
            const kbEntries = await api.getKnowledgeBase();
            const knowledgeBaseText = kbEntries.map(e => `[${e.tag}]\n${e.content}`).join('\n\n---\n\n');
            
            const locale = language === 'fa' ? 'Fa' : 'En';
            const currentAiName = panelConfig?.[`aiName${locale}`] || 'Atlas';
            const answerText = await generateAnswer(text, knowledgeBaseText, modelConfig, currentAiName);
            
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
    }, [modelConfig, t, panelConfig, language]);

    const handleClearChat = () => {
        setInitialMessage(panelConfig);
    };
    
    const handleFeedback = async (messageId: string, feedback: 'good' | 'bad') => {
        setMessages(prev => prev.map(msg => msg.id === messageId ? {...msg, feedback} : msg));
        await api.submitFeedback(messageId, feedback);
    };
    
    const handleNavigateToProfile = () => {
        // FIX: Use navigation helper.
        navigateTo('admin');
        setAdminSection('account');
    };
    
    const handleUserUpdate = async (updateData: Partial<UserCredentials>) => {
        if (!currentUser) return { success: false, message: 'No user logged in' };
        const result = await api.updateUser(currentUser.username, updateData);
        if (result.success && result.user) {
            setCurrentUser(result.user);
        }
        return result;
    };

    const handleSaveMobile = async (mobile: string) => {
        if (!currentUser) return { success: false, message: 'No user logged in' };
        const result = await api.updateUser(currentUser.username, { mobile });
        if (result.success && result.user) {
            setCurrentUser(result.user);
            setIsMobileModalOpen(false);
        }
        return result;
    };
    
    // View navigation handlers
    // FIX: Updated navigation handlers to use the new viewStack.
    const showPrivacy = () => navigateTo('privacy');
    const showTerms = () => navigateTo('terms');
    // goBack is defined above.
    
    // FIX: This function now uses the history stack, allowing proper back navigation.
    const toggleAdminDashboard = () => {
        if (currentView === 'admin') {
            goBack();
        } else {
            navigateTo('admin');
        }
    };

    const canViewAdminDashboard = currentUser && permissions && permissions[currentUser.role]?.canViewDashboard;

    // Loading screen
    if (isAuthenticating || !companyInfo) {
        return <div className="flex items-center justify-center h-screen bg-slate-100"><p>{t('loadingApplication')}</p></div>;
    }
    
    const companyName = companyInfo[language === 'fa' ? 'fa' : 'en'].name;

    // Render legal pages if view is set
    // FIX: Check currentView instead of view.
    if (currentView === 'privacy' && panelConfig) {
        return <LegalPage 
            title={t('privacyPolicy')} 
            contentEn={panelConfig.privacyPolicyEn}
            contentFa={panelConfig.privacyPolicyFa}
            onBack={goBack}
            companyName={companyName}
            logo={companyInfo.logo}
            onNavigateToPrivacy={showPrivacy}
            onNavigateToTerms={showTerms}
        />;
    }
    
    // FIX: Check currentView instead of view.
    if (currentView === 'terms' && panelConfig) {
        return <LegalPage 
            title={t('termsOfService')} 
            contentEn={panelConfig.termsOfServiceEn}
            contentFa={panelConfig.termsOfServiceFa}
            onBack={goBack}
            companyName={companyName}
            logo={companyInfo.logo}
            onNavigateToPrivacy={showPrivacy}
            onNavigateToTerms={showTerms}
        />;
    }

    // Main render logic
    // FIX: Check currentView instead of view.
    if (!currentUser || currentView === 'landing') {
        return <LandingPage 
            onLogin={handleLogin} 
            onSocialLogin={handleSocialLogin} 
            companyInfo={companyInfo}
            onNavigateToPrivacy={showPrivacy}
            onNavigateToTerms={showTerms}
        />;
    }
    
    // FIX: Check currentView instead of view.
    const isDashboardOpen = currentView === 'admin';
    const locale = language === 'fa' ? 'Fa' : 'En';
    const aiName = panelConfig?.[`aiName${locale}`] || t('appName');
    const chatHeaderTitle = panelConfig?.[`chatHeaderTitle${locale}`] || t('chatConversationTitle');
    const chatPlaceholder = panelConfig?.[`chatPlaceholder${locale}`] || t('chatInputPlaceholder');
    const aiAvatar = panelConfig?.aiAvatar || null;

    if (isDashboardOpen && canViewAdminDashboard) {
        return (
            <AdminDashboard 
                user={currentUser}
                companyName={companyName}
                onLogout={handleLogout}
                onNavigateToProfile={handleNavigateToProfile}
                onUserUpdate={handleUserUpdate}
                toggleAdminDashboard={toggleAdminDashboard}
                showAdminDashboardButton={true}
                isDashboardOpen={true}
                onCompanyInfoUpdate={setCompanyInfo}
                onPanelConfigUpdate={setPanelConfig}
                isSidebarOpen={isMobileAdminSidebarOpen}
                setIsSidebarOpen={setMobileAdminSidebarOpen}
                activeSection={adminSection}
                onSectionChange={setAdminSection}
            />
        );
    }
            
    return (
        <div className="flex flex-col h-screen bg-slate-100">
            <Header 
                user={currentUser}
                companyName={companyName}
                onLogout={handleLogout}
                onNavigateToProfile={handleNavigateToProfile}
                // FIX: Corrected a typo in the `onUserUpdate` prop passed to the Header component, changing it from `onUserUpdate` to the correctly named handler `handleUserUpdate` to resolve a reference error.
                onUserUpdate={handleUserUpdate}
                toggleAdminDashboard={toggleAdminDashboard}
                toggleMobileAdminSidebar={() => {}} // Not used in chat view
                showAdminDashboardButton={!!canViewAdminDashboard}
                isDashboardOpen={false}
            />
            <main className="flex-1 min-h-0">
                 <ChatInterface
                    messages={messages}
                    isLoading={isLoading}
                    onSendMessage={handleSendMessage}
                    onClearChat={handleClearChat}
                    onFeedback={handleFeedback}
                    error={error}
                    aiName={aiName}
                    chatHeaderTitle={chatHeaderTitle}
                    chatPlaceholder={chatPlaceholder}
                    aiAvatar={aiAvatar}
                />
            </main>
            <Footer onNavigateToPrivacy={showPrivacy} onNavigateToTerms={showTerms} />
            <MobileVerificationModal 
                isOpen={isMobileModalOpen}
                onSave={handleSaveMobile}
            />
        </div>
    );
};

// FIX: Add default export to resolve module loading error in index.tsx.
export default App;