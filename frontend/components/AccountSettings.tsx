

import React, { useState } from 'react';
import type { User } from '../types.ts';
import * as api from '../services/apiService.ts'; // Import the mock API
import { useTranslation } from '../i18n/i18n.tsx';

interface AccountSettingsProps {
    currentUser: User;
    onUpdatePassword: (username: string, oldPass: string, newPass: string) => Promise<{ success: boolean; message: string }>;
}

export const AccountSettings: React.FC<AccountSettingsProps> = ({ currentUser, onUpdatePassword }) => {
    const { t } = useTranslation();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (newPassword.length < 6) {
             setMessage({ type: 'error', text: t('passwordLengthError') });
             return;
        }

        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: t('passwordMismatchError') });
            return;
        }
        
        setIsUpdating(true);
        const result = await onUpdatePassword(currentUser.username, currentPassword, newPassword);
        setIsUpdating(false);

        if (result.success) {
            setMessage({ type: 'success', text: result.message });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } else {
            setMessage({ type: 'error', text: result.message });
        }
    };
    
    const handleRegisterPasskey = async () => {
        setMessage(null);
        try {
            const result = await api.registerPasskey(currentUser.username);
            if (result.success) {
                setMessage({ type: 'success', text: t('passkeyRegisterSuccess') });
            } else {
                setMessage({ type: 'error', text: result.message || t('passkeyRegisterFailed') });
            }
        } catch (err: any) {
             setMessage({ type: 'error', text: t('passkeyError', { message: err.message }) });
        }
    };

    return (
        <div className="space-y-8 text-start">
            {/* Change Password Section */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('accountSettingsChangePassTitle')}</h3>
                <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">{t('currentPassword')}</label>
                        <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required className="mt-1 w-full bg-gray-50 border border-gray-300 rounded-md p-2 text-black"/>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700">{t('newPassword')}</label>
                        <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required className="mt-1 w-full bg-gray-50 border border-gray-300 rounded-md p-2 text-black"/>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700">{t('confirmNewPassword')}</label>
                        <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className="mt-1 w-full bg-gray-50 border border-gray-300 rounded-md p-2 text-black"/>
                    </div>
                    {message && (
                        <p className={`text-sm p-3 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{message.text}</p>
                    )}
                    <div>
                        <button type="submit" disabled={isUpdating} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-sm disabled:bg-gray-400">
                            {isUpdating ? t('updating') : t('updatePassword')}
                        </button>
                    </div>
                </form>
            </div>

            {/* Passkey Management Section */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{t('passkeyTitle')}</h3>
                <p className="text-sm text-gray-600 mb-4">{t('passkeyDescription')}</p>
                 <button onClick={handleRegisterPasskey} className="bg-gray-700 hover:bg-gray-800 text-white font-semibold py-2 px-4 rounded-lg shadow-sm">
                    {t('registerPasskey')}
                </button>
            </div>
        </div>
    );
};