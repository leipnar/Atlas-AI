import React, { useState, useEffect } from 'react';
import type { SmtpConfig } from '../types.ts';
import * as api from '../services/apiService.ts';
import { useTranslation } from '../i18n/i18n.tsx';

interface SmtpSettingsProps {
    isReadOnly: boolean;
}

export const SmtpSettings: React.FC<SmtpSettingsProps> = ({ isReadOnly }) => {
    const { t } = useTranslation();
    const [config, setConfig] = useState<Omit<SmtpConfig, 'password'>>({ host: '', port: 587, secure: false, username: '' });
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [status, setStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        const fetchConfig = async () => {
            setIsLoading(true);
            const data = await api.getSmtpConfig();
            setConfig(data);
            setIsLoading(false);
        };
        fetchConfig();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const { checked } = e.target as HTMLInputElement;
            setConfig(prev => ({ ...prev, [name]: checked }));
        } else {
            setConfig(prev => ({ ...prev, [name]: type === 'number' ? parseInt(value, 10) : value }));
        }
    };

    const handleSave = async () => {
        setStatus(null);
        if(isReadOnly) return;
        
        const payload: SmtpConfig = { ...config, password };
        const result = await api.updateSmtpConfig(payload);

        if (result.success) {
            setStatus({ type: 'success', text: t('smtpUpdateSuccess') });
            setPassword(''); // Clear password field after save
        } else {
            setStatus({ type: 'error', text: t('smtpUpdateFailed') });
        }
        setTimeout(() => setStatus(null), 3000);
    };

    if (isLoading) {
        return <div className="p-6 text-center">{t('loading')}</div>;
    }

    return (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-6 max-w-2xl mx-auto text-start">
             <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">{t('smtpSettingsTitle')}</h2>
                {!isReadOnly && (
                     <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-sm disabled:bg-gray-400">
                        {t('saveChanges')}
                    </button>
                )}
            </div>
            <p className="text-sm text-gray-600">{t('smtpDescription')}</p>
            
            {status && (
                <p className={`text-sm p-3 rounded-md ${status.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{status.text}</p>
            )}

            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">{t('smtpHost')}</label>
                        <input type="text" name="host" value={config.host} onChange={handleChange} disabled={isReadOnly} className="mt-1 w-full bg-gray-50 border border-gray-300 rounded-md p-2 disabled:bg-gray-200" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">{t('smtpPort')}</label>
                        <input type="number" name="port" value={config.port} onChange={handleChange} disabled={isReadOnly} className="mt-1 w-full bg-gray-50 border border-gray-300 rounded-md p-2 disabled:bg-gray-200" />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">{t('smtpUsername')}</label>
                    <input type="text" name="username" value={config.username} onChange={handleChange} disabled={isReadOnly} className="mt-1 w-full bg-gray-50 border border-gray-300 rounded-md p-2 disabled:bg-gray-200" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">{t('smtpPassword')}</label>
                    <input type="password" name="password" value={password} onChange={e => setPassword(e.target.value)} disabled={isReadOnly} placeholder={t('smtpPasswordPlaceholder')} className="mt-1 w-full bg-gray-50 border border-gray-300 rounded-md p-2 disabled:bg-gray-200" />
                </div>
                <div className="flex items-center gap-4">
                    <label className="block text-sm font-medium text-gray-700">{t('smtpEncryption')}:</label>
                    <div className="flex items-center gap-2">
                         <input id="secure-checkbox" type="checkbox" name="secure" checked={config.secure} onChange={handleChange} disabled={isReadOnly} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                         <label htmlFor="secure-checkbox" className="text-sm text-gray-600">Use SSL/TLS</label>
                    </div>
                </div>
            </div>
        </div>
    );
};
