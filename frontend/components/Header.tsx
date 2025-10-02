import React, { useState } from 'react';
import type { User, UserCredentials } from '../types.ts';
import { Pyramid, LogOut, User as UserIcon, ChevronDown, Shield, ArrowLeft, Menu, ArrowRight } from 'lucide-react';
import { useTranslation } from '../i18n/i18n.tsx';
import { LanguageSwitcher } from './LanguageSwitcher.tsx';
import { UserProfileModal } from './UserProfileModal.tsx';

// Reusable Confirmation Dialog, used by other components
export const ConfirmationDialog: React.FC<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmText?: string;
}> = ({ isOpen, title, message, onConfirm, onCancel, confirmText = "Confirm" }) => {
    const { t } = useTranslation();
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-60 flex items-center justify-center z-[60]">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm m-4">
                <h2 className="text-xl font-bold text-gray-800 mb-4">{title}</h2>
                <p className="text-gray-600 mb-6">{message}</p>
                <div className="flex justify-end gap-3">
                    <button onClick={onCancel} className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-4 border border-gray-300 rounded-lg">{t('cancel')}</button>
                    <button onClick={onConfirm} className={`text-white font-semibold py-2 px-4 rounded-lg shadow-sm ${confirmText?.toLowerCase() === 'delete' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}>{confirmText}</button>
                </div>
            </div>
        </div>
    );
};


interface HeaderProps {
    user: User;
    companyName: string;
    onLogout: () => void;
    onNavigateToProfile: () => void;
    onUserUpdate: (data: Partial<UserCredentials>) => Promise<{ success: boolean; message?: string }>;
    toggleAdminDashboard: () => void;
    toggleMobileAdminSidebar: () => void;
    showAdminDashboardButton: boolean;
    isDashboardOpen: boolean;
}

export const Header: React.FC<HeaderProps> = ({ user, companyName, onLogout, onNavigateToProfile, onUserUpdate, toggleAdminDashboard, toggleMobileAdminSidebar, showAdminDashboardButton, isDashboardOpen }) => {
    const { t, language } = useTranslation();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

    const handleProfileClick = () => {
        setIsDropdownOpen(false);
        if (user.role === 'client') {
            setIsProfileModalOpen(true);
        } else {
            onNavigateToProfile();
        }
    };

    return (
        <>
            <header className="flex-shrink-0 bg-white border-b border-gray-200 shadow-sm z-30 relative">
                <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                        {isDashboardOpen ? (
                            <button onClick={toggleMobileAdminSidebar} className="p-1 text-gray-600 hover:text-blue-600 md:hidden me-2" aria-label="Open sidebar">
                                <Menu className="w-6 h-6" />
                            </button>
                        ) : (
                            <Pyramid className="w-8 h-8 text-blue-600" />
                        )}
                        <h1 className="text-xl font-bold text-gray-800 hidden sm:block">{companyName}</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        {showAdminDashboardButton && (
                             <button onClick={toggleAdminDashboard} className={`flex items-center gap-2 text-sm font-medium transition-colors p-2 rounded-lg ${isDashboardOpen ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100 hover:text-blue-600'}`}>
                                {isDashboardOpen ? (
                                    <>
                                        {language === 'fa' ? <ArrowRight className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5" />}
                                        <span className="hidden md:inline">{t('backToChat')}</span>
                                    </>
                                ) : (
                                    <>
                                        <Shield className="w-5 h-5" />
                                        <span className="hidden md:inline">{t('adminDashboard')}</span>
                                    </>
                                )}
                            </button>
                        )}
                        <LanguageSwitcher variant="light" />
                        <div className="relative">
                            <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:bg-gray-100 p-2 rounded-lg">
                                <UserIcon className="w-5 h-5" />
                                <span>{user.firstName} {user.lastName}</span>
                                <ChevronDown className="w-4 h-4" />
                            </button>
                            {isDropdownOpen && (
                                <div className="absolute end-0 mt-2 w-48 bg-white rounded-md shadow-lg border z-20">
                                    <button onClick={handleProfileClick} className="w-full text-start px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">{t('profile')}</button>
                                    <button onClick={onLogout} className="w-full text-start px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                                        <LogOut className="w-4 h-4" />
                                        {t('logout')}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>
            {user.role === 'client' && (
                <UserProfileModal
                    isOpen={isProfileModalOpen}
                    onClose={() => setIsProfileModalOpen(false)}
                    user={user}
                    onSave={onUserUpdate}
                />
            )}
        </>
    );
};