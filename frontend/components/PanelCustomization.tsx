import React, { useState, useEffect } from 'react';
import type { PanelConfig, Language } from '../types.ts';
import * as api from '../services/apiService.ts';
import { useTranslation } from '../i18n/i18n.tsx';
import { Pyramid } from 'lucide-react';

interface PanelCustomizationProps {
    onSave: (config: PanelConfig) => Promise<{ success: boolean }>;
    isReadOnly: boolean;
}

export const PanelCustomization: React.FC<PanelCustomizationProps> = ({ onSave, isReadOnly }) => {
    const { t } = useTranslation();
    const [config, setConfig] = useState<PanelConfig | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [status, setStatus] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<Language>('en');

    useEffect(() => {
        const fetchConfig = async () => {
            setIsLoading(true);
            const data = await api.getPanelConfig();
            setConfig(data);
            setAvatarPreview(data.aiAvatar);
            setIsLoading(false);
        };
        fetchConfig();
    }, []);

    if (isLoading || !config) {
        return <div className="p-6 text-center">{t('loading')}...</div>;
    }

    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setConfig(prev => (prev ? { ...prev, [name]: value } : null));
    };
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                setConfig(prev => (prev ? {...prev, aiAvatar: base64String } : null));
                setAvatarPreview(base64String);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        if (isReadOnly || !config) return;
        const result = await onSave(config);
        if (result.success) {
            setStatus(t('panelCustomizationUpdateSuccess'));
        } else {
            setStatus(t('panelCustomizationUpdateFailed'));
        }
        setTimeout(() => setStatus(null), 3000);
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-6 text-start">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">{t('panelCustomization')}</h2>
                {!isReadOnly && (
                    <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-sm">
                        {t('saveChanges')}
                    </button>
                )}
            </div>
            {status && <p className="text-sm text-green-600 bg-green-50 p-3 rounded-md">{status}</p>}
            
            <div className="space-y-6 pt-4 border-t">
                 <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-4 rtl:space-x-reverse">
                        <button onClick={() => setActiveTab('en')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'en' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>{t('english')}</button>
                        <button onClick={() => setActiveTab('fa')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'fa' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>{t('persian')}</button>
                    </nav>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Form Fields */}
                    <div className="md:col-span-2 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">{t('aiNameLabel')}</label>
                            <input name={activeTab === 'en' ? 'aiNameEn' : 'aiNameFa'} type="text" value={activeTab === 'en' ? config.aiNameEn : config.aiNameFa} onChange={handleTextChange} disabled={isReadOnly} className="mt-1 w-full bg-gray-50 border border-gray-300 rounded-md p-2 disabled:bg-gray-200 text-black" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">{t('chatHeaderTitleLabel')}</label>
                            <input name={activeTab === 'en' ? 'chatHeaderTitleEn' : 'chatHeaderTitleFa'} type="text" value={activeTab === 'en' ? config.chatHeaderTitleEn : config.chatHeaderTitleFa} onChange={handleTextChange} disabled={isReadOnly} className="mt-1 w-full bg-gray-50 border border-gray-300 rounded-md p-2 disabled:bg-gray-200 text-black" />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700">{t('chatPlaceholderLabel')}</label>
                            <input name={activeTab === 'en' ? 'chatPlaceholderEn' : 'chatPlaceholderFa'} type="text" value={activeTab === 'en' ? config.chatPlaceholderEn : config.chatPlaceholderFa} onChange={handleTextChange} disabled={isReadOnly} className="mt-1 w-full bg-gray-50 border border-gray-300 rounded-md p-2 disabled:bg-gray-200 text-black" />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700">{t(activeTab === 'en' ? 'welcomeMessageEnLabel' : 'welcomeMessageFaLabel')}</label>
                            <textarea name={activeTab === 'en' ? 'welcomeMessageEn' : 'welcomeMessageFa'} value={activeTab === 'en' ? config.welcomeMessageEn : config.welcomeMessageFa} onChange={handleTextChange} disabled={isReadOnly} rows={3} className="mt-1 w-full bg-gray-50 border border-gray-300 rounded-md p-2 resize-y disabled:bg-gray-200 text-black" />
                            <p className="text-xs text-gray-500 mt-1">{t('welcomeMessageDescription')}</p>
                        </div>
                    </div>

                    {/* Avatar Uploader */}
                    <div className="md:col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('aiAvatarLabel')}</label>
                        <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg">
                           {avatarPreview ? (
                                <img src={avatarPreview} alt="Avatar Preview" className="h-24 w-24 rounded-full object-cover" />
                           ) : (
                                <div className="text-center p-4">
                                    <Pyramid className="w-16 h-16 text-gray-400 mx-auto" />
                                    <p className="text-xs text-gray-500 mt-2">{t('noAvatarUploaded')}</p>
                                </div>
                           )}
                           {!isReadOnly && (
                                <div className="mt-4">
                                    <label htmlFor="avatar-upload" className="cursor-pointer text-sm text-blue-600 hover:text-blue-500 font-medium">
                                        {avatarPreview ? t('changeAvatar') : t('uploadAvatar')}
                                    </label>
                                    <input id="avatar-upload" type="file" className="hidden" accept="image/png, image/jpeg" onChange={handleFileChange} />
                                </div>
                           )}
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="space-y-4 pt-4 border-t">
                <div>
                    <label className="block text-sm font-medium text-gray-700">{t('privacyPolicyContent')}</label>
                    <textarea name={activeTab === 'en' ? 'privacyPolicyEn' : 'privacyPolicyFa'} value={activeTab === 'en' ? config.privacyPolicyEn : config.privacyPolicyFa} onChange={handleTextChange} disabled={isReadOnly} rows={8} className="mt-1 w-full bg-gray-50 border border-gray-300 rounded-md p-2 resize-y disabled:bg-gray-200 text-black" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">{t('termsOfServiceContent')}</label>
                    <textarea name={activeTab === 'en' ? 'termsOfServiceEn' : 'termsOfServiceFa'} value={activeTab === 'en' ? config.termsOfServiceEn : config.termsOfServiceFa} onChange={handleTextChange} disabled={isReadOnly} rows={8} className="mt-1 w-full bg-gray-50 border border-gray-300 rounded-md p-2 resize-y disabled:bg-gray-200 text-black" />
                </div>
            </div>

        </div>
    );
};