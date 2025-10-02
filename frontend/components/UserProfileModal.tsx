

import React, { useState, useEffect } from 'react';
import type { User, UserCredentials } from '../types.ts';
import { useTranslation } from '../i18n/i18n.tsx';
import * as api from '../services/apiService.ts';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onSave: (profileData: Partial<UserCredentials>) => Promise<{ success: boolean; message?: string }>;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose, user, onSave }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    email: '',
    mobile: '',
  });
  
  // State for password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [infoMessage, setInfoMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingDetails, setIsFetchingDetails] = useState(true);

  useEffect(() => {
    if (isOpen && user) {
      setIsFetchingDetails(true);
      setInfoMessage(null);
      setPasswordMessage(null);
      
      const fetchUserDetails = async () => {
        try {
          const result = await api.getUsers({ page: 1, limit: 1, search: user.username });
          if (result.users.length > 0) {
            const fullUser = result.users[0];
            setFormData({
              firstName: fullUser.firstName,
              lastName: fullUser.lastName,
              email: fullUser.email,
              mobile: fullUser.mobile,
            });
          } else {
             setInfoMessage({type: 'error', text: t('userProfileFetchError', { message: 'User not found' }) });
          }
        } catch (e) {
            setInfoMessage({ type: 'error', text: t('userProfileFetchError', { message: (e as Error).message }) });
        } finally {
            setIsFetchingDetails(false);
        }
      };

      fetchUserDetails();
    }
  }, [isOpen, user, t]);

  if (!isOpen) {
    return null;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveInfo = async () => {
    setInfoMessage(null);
    setIsLoading(true);

    const payload: Partial<UserCredentials> = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      mobile: formData.mobile,
    };

    const result = await onSave(payload);
    setIsLoading(false);

    if (result.success) {
        setInfoMessage({ type: 'success', text: t('userProfileUpdateSuccess')});
    } else {
        setInfoMessage({ type: 'error', text: result.message || t('userProfileUpdateFailed') });
    }
  };

  const handlePasswordChange = async () => {
        setPasswordMessage(null);

        if (!currentPassword || !newPassword) {
            setPasswordMessage({ type: 'error', text: t('formRequiredError') });
            return;
        }
        if (newPassword.length < 6) {
             setPasswordMessage({ type: 'error', text: t('passwordLengthError') });
             return;
        }
        if (newPassword !== confirmPassword) {
            setPasswordMessage({ type: 'error', text: t('passwordMismatchError') });
            return;
        }
        
        setIsLoading(true);
        const result = await api.updatePassword(user.username, currentPassword, newPassword);
        setIsLoading(false);

        if (result.success) {
            setPasswordMessage({ type: 'success', text: result.message });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } else {
            setPasswordMessage({ type: 'error', text: result.message });
        }
    };


  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md text-start flex flex-col max-h-full">
        <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800">{t('profile')}</h2>
        </div>
        <div className="p-6 overflow-y-auto">
            {isFetchingDetails ? (
                <div className="text-center p-8">{t('loading')}...</div>
            ) : (
            <div className="space-y-6 divide-y divide-gray-200">
                {/* --- Personal Info Section --- */}
                <div className="space-y-4 pt-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-gray-700">{t('firstName')}</label>
                            <input name="firstName" value={formData.firstName} onChange={handleChange} className="mt-1 w-full bg-gray-50 border border-gray-300 rounded-md p-2 text-black" />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700">{t('lastName')}</label>
                            <input name="lastName" value={formData.lastName} onChange={handleChange} className="mt-1 w-full bg-gray-50 border border-gray-300 rounded-md p-2 text-black" />
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700">{t('email')}</label>
                        <input type="email" name="email" value={formData.email} onChange={handleChange} className="mt-1 w-full bg-gray-50 border border-gray-300 rounded-md p-2 text-black" />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700">{t('mobile')}</label>
                        <input name="mobile" value={formData.mobile} onChange={handleChange} className="mt-1 w-full bg-gray-50 border border-gray-300 rounded-md p-2 text-black" />
                    </div>
                    {infoMessage && <p className={`text-sm p-2 rounded-md ${infoMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{infoMessage.text}</p>}
                    <div className="text-end">
                        <button onClick={handleSaveInfo} disabled={isLoading || isFetchingDetails} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-sm disabled:bg-gray-400">
                            {isLoading ? t('saving') : t('saveChanges')}
                        </button>
                    </div>
                </div>
                {/* --- Change Password Section --- */}
                <div className="space-y-4 pt-6">
                    <h3 className="text-lg font-semibold text-gray-800">{t('accountSettingsChangePassTitle')}</h3>
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
                    {passwordMessage && <p className={`text-sm p-2 rounded-md ${passwordMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{passwordMessage.text}</p>}
                    <div className="text-end">
                        <button onClick={handlePasswordChange} disabled={isLoading} className="bg-gray-700 hover:bg-gray-800 text-white font-semibold py-2 px-4 rounded-lg shadow-sm disabled:bg-gray-400">
                            {isLoading ? t('updating') : t('updatePassword')}
                        </button>
                    </div>
                </div>
            </div>
            )}
        </div>
        <div className="flex-shrink-0 flex justify-end gap-3 p-4 bg-gray-50 border-t border-gray-200">
          <button onClick={onClose} disabled={isLoading} className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-4 border border-gray-300 rounded-lg disabled:opacity-50">
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
};