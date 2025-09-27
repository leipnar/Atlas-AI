import React, { useState, useEffect, useMemo } from 'react';
import type { User, RolePermissions, ModelConfig, CompanyInfo } from '../types.ts';
import { UserManagement } from './UserManagement.tsx';
import { KnowledgeBaseManagement } from './KnowledgeBaseManagement.tsx';
import { RoleManagement } from './RoleManagement.tsx';
import { ModelConfiguration } from './ModelConfiguration.tsx';
import { ChatLogs } from './ChatLogs.tsx';
import { CompanySettings } from './CompanySettings.tsx';
import { SmtpSettings } from './SmtpSettings.tsx';
import * as api from '../services/apiService.ts';
import { X, Users, Database, Shield, Bot, Building, Mail, BarChart2, Menu } from 'lucide-react';
import { useTranslation } from '../i18n/i18n.tsx';

interface AdminDashboardProps {
    user: User;
    onClose: () => void;
}

type NavItem = {
    key: string;
    label: string;
    icon: React.ElementType;
    component: React.ReactNode;
    permission: keyof RolePermissions;
};

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onClose }) => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('');
    const [permissions, setPermissions] = useState<RolePermissions | null>(null);
    const [initialModelConfig, setInitialModelConfig] = useState<ModelConfig | null>(null);
    const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [perms, modelConfig, companyData] = await Promise.all([
                    api.getPermissions(),
                    api.getModelConfig(),
                    api.getCompanyInfo(),
                ]);
                setPermissions(perms[user.role]);
                setInitialModelConfig(modelConfig);
                setCompanyInfo(companyData);
            } catch (error) {
                console.error("Failed to load dashboard data:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [user.role]);

    const navItems: NavItem[] = useMemo(() => [
        { key: 'users', label: t('userManagement'), icon: Users, component: <UserManagement currentUser={user} />, permission: 'canManageUsers' },
        { key: 'knowledge', label: t('knowledgeBase'), icon: Database, component: <KnowledgeBaseManagement isReadOnly={!permissions?.canManageKnowledgeBase} />, permission: 'canManageKnowledgeBase' },
        { key: 'roles', label: t('roleManagement'), icon: Shield, component: <RoleManagement />, permission: 'canManageRoles' },
        { key: 'model', label: t('modelConfiguration'), icon: Bot, component: initialModelConfig ? <ModelConfiguration initialConfig={initialModelConfig} onSave={api.updateModelConfig} isReadOnly={!permissions?.canConfigureModel} /> : null, permission: 'canConfigureModel' },
        { key: 'company', label: t('companySettings'), icon: Building, component: companyInfo ? <CompanySettings companyInfo={companyInfo} onSave={api.updateCompanyInfo} isReadOnly={!permissions?.canManageCompanyInfo} /> : null, permission: 'canManageCompanyInfo' },
        { key: 'smtp', label: t('smtpSettings'), icon: Mail, component: <SmtpSettings isReadOnly={!permissions?.canConfigureSmtp} />, permission: 'canConfigureSmtp' },
        { key: 'logs', label: t('chatLogs'), icon: BarChart2, component: <ChatLogs />, permission: 'canViewChatLogs' },
    ], [t, user, permissions, initialModelConfig, companyInfo]);
    
    const visibleNavItems = useMemo(() => {
        if (!permissions) return [];
        return navItems.filter(item => permissions[item.permission]);
    }, [permissions, navItems]);

    useEffect(() => {
        if (visibleNavItems.length > 0 && !activeTab) {
            setActiveTab(visibleNavItems[0].key);
        }
    }, [visibleNavItems, activeTab]);

    const activeComponent = useMemo(() => {
        return navItems.find(item => item.key === activeTab)?.component || null;
    }, [activeTab, navItems]);

    if (isLoading) {
        return <div className="fixed inset-0 bg-white z-40 flex items-center justify-center"><p>{t('loading')}...</p></div>;
    }

    return (
        <div className="fixed inset-0 bg-gray-50 z-40 flex">
            {/* Overlay for all screen sizes */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/40 z-10"
                    onClick={() => setIsSidebarOpen(false)}
                    aria-hidden="true"
                ></div>
            )}
            {/* Sidebar */}
            <aside className={`absolute inset-y-0 start-0 z-20 w-64 bg-gray-800 text-white flex-shrink-0 flex flex-col p-4 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : 'ltr:-translate-x-full rtl:translate-x-full'}`}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-semibold">{t('adminPanel')}</h2>
                    <button onClick={() => setIsSidebarOpen(false)} className="p-1 rounded-full hover:bg-gray-700">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <nav className="flex-grow space-y-2">
                    {visibleNavItems.map(item => (
                        <button
                            key={item.key}
                            onClick={() => {
                                setActiveTab(item.key);
                                setIsSidebarOpen(false);
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors text-start ${activeTab === item.key ? 'bg-gray-700' : 'hover:bg-gray-700/50'}`}
                        >
                            <item.icon className="w-5 h-5" />
                            {item.label}
                        </button>
                    ))}
                </nav>
            </aside>
            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden">
                 <div className="flex-shrink-0 p-4 bg-white border-b border-gray-200 flex justify-between items-center">
                    <div className="flex items-center">
                        <button onClick={() => setIsSidebarOpen(true)} className="p-1 rounded-full hover:bg-gray-200 me-3">
                           <Menu className="w-6 h-6 text-gray-600" />
                        </button>
                        <h1 className="text-xl font-bold text-gray-800">
                            {navItems.find(item => item.key === activeTab)?.label}
                        </h1>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200">
                        <X className="w-6 h-6 text-gray-600" />
                    </button>
                </div>
                <div className="flex-grow overflow-y-auto p-6 bg-gray-100">
                    {activeComponent}
                </div>
            </main>
        </div>
    );
};