import React, { useState, useEffect, useRef } from 'react';
import {
    LayoutDashboard, Users, BrainCircuit, Building, MessageSquare, KeyRound,
    Settings, X, Menu, Shield, Mail, Archive, Globe, MapPin, Monitor,
    Smartphone, Laptop, Computer, Compass, Clock, ThumbsUp, HelpCircle
} from 'lucide-react';
import type { UserCredentials, AllRolePermissions, CompanyInfo, ModelConfig, PanelConfig, DashboardSection, UserRole } from '../types';
import * as api from '../services/apiService';
import { useTranslation } from '../i18n/i18n';
import { Header } from './Header';
import { Footer } from './Footer';

import { UserManagement } from './UserManagement';
import { RoleManagement } from './RoleManagement';
import { KnowledgeBaseManagement } from './KnowledgeBaseManagement';
import { ModelConfiguration } from './ModelConfiguration';
import { CompanySettings } from './CompanySettings';
import { ChatLogs } from './ChatLogs';
import { AccountSettings } from './AccountSettings';
import { SmtpSettings } from './SmtpSettings';
import { PanelCustomization } from './PanelCustomization';
import { BackupAndRestore } from './BackupAndRestore';

// Since Chart.js is loaded from a CDN, we declare it globally for TypeScript
declare const Chart: any;

interface ChartComponentProps {
    type: 'bar' | 'doughnut' | 'line' | 'pie';
    data: any;
    options?: any;
}

const ChartComponent: React.FC<ChartComponentProps> = ({ type, data, options }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const chartRef = useRef<any>(null);

    useEffect(() => {
        if (canvasRef.current) {
            // Destroy previous chart instance if it exists
            if (chartRef.current) {
                chartRef.current.destroy();
            }

            const ctx = canvasRef.current.getContext('2d');
            if (ctx) {
                chartRef.current = new Chart(ctx, {
                    type,
                    data,
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        ...options,
                    },
                });
            }
        }

        // Cleanup function to destroy chart on component unmount
        return () => {
            if (chartRef.current) {
                chartRef.current.destroy();
            }
        };
    }, [type, data, options]);

    return <div className="relative h-80"><canvas ref={canvasRef} /></div>;
};


interface AdminDashboardProps {
    user: UserCredentials;
    companyName: string;
    onLogout: () => void;
    onNavigateToProfile: () => void;
    onUserUpdate: (data: Partial<UserCredentials>) => Promise<{ success: boolean; message?: string }>;
    toggleAdminDashboard: () => void;
    showAdminDashboardButton: boolean;
    isDashboardOpen: boolean;
    onCompanyInfoUpdate: (info: CompanyInfo) => void;
    onPanelConfigUpdate: (config: PanelConfig) => void;
    isSidebarOpen: boolean;
    setIsSidebarOpen: (isOpen: boolean) => void;
    activeSection: DashboardSection;
    onSectionChange: (section: DashboardSection) => void;
}

const StatCard: React.FC<{ icon: React.ElementType, title: string, value: string | number, color: string }> = ({ icon: Icon, title, value, color }) => (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 flex items-center gap-6">
        <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${color}`}>
            <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-3xl font-bold text-gray-800">{value}</p>
        </div>
    </div>
);

const getBrowserInfo = () => {
    const ua = navigator.userAgent;
    if (ua.indexOf("Firefox") > -1) return "Mozilla Firefox";
    if (ua.indexOf("SamsungBrowser") > -1) return "Samsung Internet";
    if (ua.indexOf("Opera") > -1 || ua.indexOf("OPR") > -1) return "Opera";
    if (ua.indexOf("Trident") > -1) return "Microsoft Internet Explorer";
    if (ua.indexOf("Edge") > -1) return "Microsoft Edge";
    if (ua.indexOf("Chrome") > -1) return "Google Chrome";
    if (ua.indexOf("Safari") > -1) return "Apple Safari";
    return "Unknown";
};


export const AdminDashboard: React.FC<AdminDashboardProps> = ({
    user, companyName, onLogout, onNavigateToProfile, onUserUpdate, toggleAdminDashboard, showAdminDashboardButton, isDashboardOpen,
    onCompanyInfoUpdate, onPanelConfigUpdate, isSidebarOpen, setIsSidebarOpen, activeSection, onSectionChange
}) => {
    const { t, language } = useTranslation();
    const [permissions, setPermissions] = useState<AllRolePermissions | null>(null);
    const [modelConfig, setModelConfig] = useState<ModelConfig | null>(null);
    const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
    const [stats, setStats] = useState<{ userCount: number; logCount: number; kbCount: number, unansweredCount: number } | null>(null);
    const [activityData, setActivityData] = useState<any>(null);
    const [feedbackData, setFeedbackData] = useState<any>(null);
    const [volumeByHourData, setVolumeByHourData] = useState<any>(null);

    const userPermissions = permissions ? permissions[user.role] : null;

    useEffect(() => {
        const fetchData = async () => {
            const [
                perms, modelCfg, companyInf, userCount, logCount, kbCount,
                activity, feedback, unansweredCount, volumeByHour
            ] = await Promise.all([
                api.getPermissions(),
                api.getModelConfig(),
                api.getCompanyInfo(),
                api.getUserCount(),
                api.getChatLogCount(),
                api.getKbEntryCount(),
                api.getChatActivity(),
                api.getFeedbackStats(),
                api.getUnansweredQuestionsCount(),
                api.getChatVolumeByHour(),
            ]);
            setPermissions(perms);
            setModelConfig(modelCfg);
            setCompanyInfo(companyInf);
            setStats({ userCount, logCount, kbCount, unansweredCount });

            // Prepare Chat Volume by Hour Chart Data
            const volumeLabels = Array.from({ length: 24 }, (_, i) => `${i}:00`);
            setVolumeByHourData({
                labels: volumeLabels,
                datasets: [{
                    label: t('messages'),
                    data: volumeByHour,
                    backgroundColor: 'rgba(139, 92, 246, 0.5)',
                    borderColor: 'rgba(139, 92, 246, 1)',
                    borderWidth: 1
                }]
            });

            // Prepare Chat Activity Chart Data
            const activityLabels = activity.map(a => new Date(a.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric'}));
            const activityCounts = activity.map(a => a.count);
            setActivityData({
                labels: activityLabels,
                datasets: [{
                    label: t('conversations'),
                    data: activityCounts,
                    backgroundColor: 'rgba(59, 130, 246, 0.5)',
                    borderColor: 'rgba(59, 130, 246, 1)',
                    borderWidth: 1
                }]
            });

            // Prepare Feedback Ratio Chart Data
            setFeedbackData({
                labels: [t('goodFeedback'), t('badFeedback')],
                datasets: [{
                    label: 'Feedback',
                    data: [feedback.good, feedback.bad],
                    backgroundColor: ['#22C55E', '#EF4444'],
                    hoverOffset: 4
                }]
            });
        };
        fetchData();
    }, [t]);

    const handleModelConfigSave = async (config: ModelConfig) => {
        const result = await api.updateModelConfig(config);
        if (result.success) setModelConfig(config);
        return result;
    };
    
    const handleCompanyInfoSave = async (info: CompanyInfo) => {
        const result = await api.updateCompanyInfo(info);
        if (result.success) {
            setCompanyInfo(info);
            onCompanyInfoUpdate(info);
        }
        return result;
    };
    
    const handlePanelConfigSave = async (config: PanelConfig) => {
        const result = await api.updatePanelConfig(config);
        if (result.success) onPanelConfigUpdate(config);
        return result;
    };

    const navItems = [
        { id: 'dashboard', label: t('frontDesk'), icon: LayoutDashboard, permission: userPermissions?.canViewDashboard },
        { id: 'users', label: t('userManagement'), icon: Users, permission: userPermissions?.canManageUsers },
        { id: 'roles', label: t('roleManagement'), icon: Shield, permission: userPermissions?.canManageRoles },
        { id: 'knowledge', label: t('knowledgeBase'), icon: BrainCircuit, permission: userPermissions?.canManageKB },
        { id: 'model', label: t('modelConfigTitle'), icon: Settings, permission: userPermissions?.canViewModelConfig },
        { id: 'company', label: t('companyBrandingTitle'), icon: Building, permission: userPermissions?.canViewCompanySettings },
        { id: 'panel', label: t('panelCustomization'), icon: LayoutDashboard, permission: userPermissions?.canCustomizePanel },
        { id: 'logs', label: t('chatLogsTitle'), icon: MessageSquare, permission: userPermissions?.canViewChatLogs },
        { id: 'smtp', label: t('smtpSettings'), icon: Mail, permission: userPermissions?.canViewSmtpSettings },
        { id: 'backup', label: t('backupAndRestore'), icon: Archive, permission: userPermissions?.canManageBackups },
        { id: 'account', label: t('accountSettings'), icon: KeyRound, permission: true },
    ].filter(item => item.permission);


    const renderSection = () => {
        if (!userPermissions) return <div>{t('loading')}...</div>;
        
        switch (activeSection) {
            case 'dashboard':
                const browser = getBrowserInfo();
                const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
                const deviceType = user.device?.toLowerCase();

                const DeviceIcon = () => {
                    if (deviceType?.includes('mobile')) return <Smartphone className="w-5 h-5 text-gray-500" />;
                    if (deviceType?.includes('laptop')) return <Laptop className="w-5 h-5 text-gray-500" />;
                    return <Monitor className="w-5 h-5 text-gray-500" />;
                };

                const sessionDetails = [
                    { label: t('ipAddress'), value: user.ip, icon: <Globe className="w-5 h-5 text-gray-500" /> },
                    { label: t('location'), value: t('locationUnknown'), icon: <MapPin className="w-5 h-5 text-gray-500" /> },
                    { label: t('device'), value: user.device, icon: <DeviceIcon /> },
                    { label: t('operatingSystem'), value: user.os, icon: <Computer className="w-5 h-5 text-gray-500" /> },
                    { label: t('browser'), value: browser, icon: <Compass className="w-5 h-5 text-gray-500" /> },
                    { label: t('timeZone'), value: timeZone, icon: <Clock className="w-5 h-5 text-gray-500" /> },
                ];
                 return (
                    <div className="text-start space-y-8">
                        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('sessionDetails')}</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
                                {sessionDetails.map(detail => (
                                    <div key={detail.label} className="flex items-center gap-3">
                                        <div className="flex-shrink-0">{detail.icon}</div>
                                        <div>
                                            <p className="text-xs font-medium text-gray-500">{detail.label}</p>
                                            <p className="text-sm font-semibold text-gray-800 truncate">{detail.value}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        {stats ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <StatCard 
                                    icon={Users}
                                    title={t('totalUsers')}
                                    value={stats.userCount}
                                    color="bg-blue-500"
                                />
                                <StatCard 
                                    icon={MessageSquare}
                                    title={t('totalConversations')}
                                    value={stats.logCount}
                                    color="bg-green-500"
                                />
                                <StatCard 
                                    icon={BrainCircuit}
                                    title={t('kbEntries')}
                                    value={stats.kbCount}
                                    color="bg-purple-500"
                                />
                                <StatCard 
                                    icon={HelpCircle}
                                    title={t('unansweredQuestions')}
                                    value={stats.unansweredCount}
                                    color="bg-orange-500"
                                />
                            </div>
                        ) : (
                             <div>{t('loading')}...</div>
                        )}
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2"><Clock className="w-5 h-5" />{t('chatVolumeByHour')}</h3>
                                    {volumeByHourData ? <ChartComponent type="bar" data={volumeByHourData} options={{ scales: { y: { beginAtZero: true, title: { display: true, text: t('messages') } }, x: { title: { display: true, text: t('hourOfDay') } } } }} /> : <div>{t('loading')}...</div>}
                                </div>
                                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2"><ThumbsUp className="w-5 h-5" />{t('feedbackRatio')}</h3>
                                    {feedbackData ? <ChartComponent type="pie" data={feedbackData} /> : <div>{t('loading')}...</div>}
                                </div>
                            </div>
                            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2"><MessageSquare className="w-5 h-5" />{t('chatActivityLast30Days')}</h3>
                                {activityData ? <ChartComponent type="bar" data={activityData} options={{ scales: { y: { beginAtZero: true } } }} /> : <div>{t('loading')}...</div>}
                            </div>
                        </div>
                    </div>
                );
            case 'users':
                return <UserManagement currentUser={user} permissions={userPermissions} />;
            case 'roles':
                return <RoleManagement />;
            case 'knowledge':
                return <KnowledgeBaseManagement isReadOnly={!userPermissions.canManageKB} />;
            case 'model':
                 return modelConfig && <ModelConfiguration initialConfig={modelConfig} onSave={handleModelConfigSave} isReadOnly={!userPermissions.canEditModelConfig} />;
            case 'company':
                return companyInfo && <CompanySettings companyInfo={companyInfo} onSave={handleCompanyInfoSave} isReadOnly={!userPermissions.canEditCompanySettings} />;
            case 'panel':
                 return <PanelCustomization onSave={handlePanelConfigSave} isReadOnly={!userPermissions.canCustomizePanel} />;
            case 'logs':
                return <ChatLogs />;
            case 'smtp':
                return <SmtpSettings isReadOnly={!userPermissions.canEditSmtpSettings} />;
            case 'backup':
                 return <BackupAndRestore />;
            case 'account':
                return <AccountSettings currentUser={user} onUpdatePassword={api.updatePassword} />;
            default:
                return <div>{t('selectSection')}</div>;
        }
    };
    
    const sidebarContent = (
         <div className="flex flex-col h-full bg-gray-800 text-white">
            <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                <h1 className="text-xl font-bold">{t('adminDashboard')}</h1>
                <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-1 text-gray-400 hover:text-white">
                    <X className="w-6 h-6" />
                </button>
            </div>
            <nav className="flex-grow p-2 space-y-1">
                {navItems.map(item => (
                    <button
                        key={item.id}
                        onClick={() => { onSectionChange(item.id as DashboardSection); setIsSidebarOpen(false); }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                            activeSection === item.id ? 'bg-gray-900' : 'hover:bg-gray-700'
                        }`}
                    >
                        <item.icon className="w-5 h-5" />
                        <span>{item.label}</span>
                    </button>
                ))}
            </nav>
        </div>
    );

    return (
        <div className="flex h-screen bg-slate-100 no-scrollbar">
            {/* Overlay for mobile */}
            {isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-black/60 z-30 md:hidden" />}

            {/* Sidebar */}
            <aside className={`fixed top-0 bottom-0 z-40 h-screen w-64 bg-gray-800 transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${language === 'fa' ? 'md:border-l' : 'md:border-r'} border-gray-200 start-0 ${
                isSidebarOpen 
                ? 'translate-x-0'
                : (language === 'fa' ? 'translate-x-full' : '-translate-x-full')
            }`}>
                {sidebarContent}
            </aside>

            {/* Main content panel */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                <Header 
                    user={user}
                    companyName={companyName}
                    onLogout={onLogout}
                    onNavigateToProfile={onNavigateToProfile}
                    onUserUpdate={onUserUpdate}
                    toggleAdminDashboard={toggleAdminDashboard}
                    toggleMobileAdminSidebar={() => setIsSidebarOpen(p => !p)}
                    showAdminDashboardButton={showAdminDashboardButton}
                    isDashboardOpen={isDashboardOpen}
                />
                <main className="flex-1 min-h-0 overflow-y-auto no-scrollbar p-4 sm:p-6 lg:p-8">
                    {renderSection()}
                </main>
                <Footer />
            </div>
        </div>
    );
};