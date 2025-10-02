

import React, { useState, useEffect } from 'react';
import type { CompanyInfo, Language } from '../types.ts';
import { Pyramid } from 'lucide-react';
import { useTranslation } from '../i18n/i18n.tsx';

interface CompanySettingsProps {
    companyInfo: CompanyInfo;
    onSave: (info: CompanyInfo) => Promise<{ success: boolean }>;
    isReadOnly: boolean;
}

export const CompanySettings: React.FC<CompanySettingsProps> = ({ companyInfo, onSave, isReadOnly }) => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState(companyInfo);
    const [logoPreview, setLogoPreview] = useState<string | null>(companyInfo.logo);
    const [status, setStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [activeTab, setActiveTab] = useState<Language>('en');

    useEffect(() => {
        setFormData(companyInfo);
        setLogoPreview(companyInfo.logo);
    }, [companyInfo]);
    
    const hasChanges = JSON.stringify(formData) !== JSON.stringify(companyInfo);

    const handleLocaleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ 
            ...prev, 
            [activeTab]: {
                ...prev[activeTab],
                [name]: value,
            } 
        }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                setFormData(prev => ({...prev, logo: base64String }));
                setLogoPreview(base64String);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        setStatus(null);
        if(isReadOnly) return;
        
        const result = await onSave(formData);
        if (result.success) {
            setStatus({ type: 'success', text: t('companyInfoUpdateSuccess') });
        } else {
            setStatus({ type: 'error', text: t('companyInfoUpdateFailed') });
        }
        setTimeout(() => setStatus(null), 3000);
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-6 text-start">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">{t('companyBrandingTitle')}</h2>
                {!isReadOnly && (
                     <button onClick={handleSave} disabled={!hasChanges} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-sm disabled:bg-gray-400 disabled:cursor-not-allowed">
                        {t('saveChanges')}
                    </button>
                )}
            </div>
            {status && (
                <p className={`text-sm p-3 rounded-md ${status.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{status.text}</p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Form Fields */}
                <div className="md:col-span-2 space-y-4">
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex space-x-4 rtl:space-x-reverse">
                            <button onClick={() => setActiveTab('en')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'en' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>{t('english')}</button>
                            <button onClick={() => setActiveTab('fa')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'fa' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>{t('persian')}</button>
                        </nav>
                    </div>

                    <div className="space-y-4 pt-2">
                         <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">{t('companyName')}</label>
                            <input id="name" name="name" type="text" value={formData[activeTab].name} onChange={handleLocaleChange} disabled={isReadOnly} className="mt-1 w-full bg-gray-50 border border-gray-300 rounded-md p-2 disabled:bg-gray-200 text-black" />
                        </div>
                         <div>
                            <label htmlFor="about" className="block text-sm font-medium text-gray-700">{t('aboutCompany')}</label>
                            <textarea id="about" name="about" value={formData[activeTab].about} onChange={handleLocaleChange} disabled={isReadOnly} rows={5} className="mt-1 w-full bg-gray-50 border border-gray-300 rounded-md p-2 resize-y disabled:bg-gray-200 text-black" />
                        </div>
                    </div>
                </div>

                {/* Logo Uploader */}
                <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('companyLogo')}</label>
                    <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg">
                       {logoPreview ? (
                            <img src={logoPreview} alt="Logo Preview" className="h-24 w-auto object-contain" />
                       ) : (
                            <div className="text-center p-4">
                                <Pyramid className="w-16 h-16 text-gray-400 mx-auto" />
                                <p className="text-xs text-gray-500 mt-2">{t('noLogoUploaded')}</p>
                            </div>
                       )}
                       {!isReadOnly && (
                            <div className="mt-4">
                                <label htmlFor="logo-upload" className="cursor-pointer text-sm text-blue-600 hover:text-blue-500 font-medium">
                                    {logoPreview ? t('changeLogo') : t('uploadLogo')}
                                </label>
                                <input id="logo-upload" type="file" className="hidden" accept="image/png, image/jpeg, image/svg+xml" onChange={handleFileChange} />
                            </div>
                       )}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">{t('logoRecommendations')}</p>
                </div>
            </div>
        </div>
    );
};