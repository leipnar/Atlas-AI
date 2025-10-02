

import React, { useState, useEffect } from 'react';
import type { SmtpConfig, EmailTemplate } from '../types.ts';
import * as api from '../services/apiService.ts';
import { useTranslation } from '../i18n/i18n.tsx';
import { Mail, TestTube2 } from 'lucide-react';

// --- Test Email Modal ---
const TestEmailModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSend: (recipient: string) => Promise<{success: boolean, message: string}>;
}> = ({ isOpen, onClose, onSend }) => {
    const { t } = useTranslation();
    const [recipient, setRecipient] = useState('');
    const [status, setStatus] = useState<{ type: 'info'|'success'|'error', text: string} | null>(null);

    useEffect(() => {
        if (isOpen) {
            setRecipient('');
            setStatus(null);
        }
    }, [isOpen]);

    if (!isOpen) return null;
    
    const handleSend = async () => {
        if (!recipient) return;
        setStatus({ type: 'info', text: t('smtpTestSending') });
        const result = await onSend(recipient);
        if (result.success) {
            setStatus({ type: 'success', text: result.message });
        } else {
            setStatus({ type: 'error', text: result.message });
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-60 flex items-center justify-center z-50">
             <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md m-4 text-start">
                <h2 className="text-xl font-bold text-gray-800 mb-4">{t('sendTestEmail')}</h2>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="recipient" className="block text-sm font-medium text-gray-700">{t('recipientEmail')}</label>
                        <input id="recipient" type="email" value={recipient} onChange={e => setRecipient(e.target.value)} className="mt-1 w-full bg-gray-50 border border-gray-300 rounded-md p-2 text-black"/>
                    </div>
                    {status && <p className={`text-sm p-2 rounded-md ${
                        status.type === 'success' ? 'bg-green-50 text-green-700' :
                        status.type === 'error' ? 'bg-red-50 text-red-700' :
                        'bg-blue-50 text-blue-700'
                    }`}>{status.text}</p>}
                </div>
                <div className="flex justify-end gap-3 mt-6">
                    <button onClick={onClose} className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-4 border border-gray-300 rounded-lg">{t('close')}</button>
                    <button onClick={handleSend} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg">{t('send')}</button>
                </div>
             </div>
        </div>
    );
};

// --- Main Component ---
interface SmtpSettingsProps {
    isReadOnly: boolean;
}

export const SmtpSettings: React.FC<SmtpSettingsProps> = ({ isReadOnly }) => {
    const { t } = useTranslation();
    const [config, setConfig] = useState<SmtpConfig | null>(null);
    const [status, setStatus] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isTestModalOpen, setIsTestModalOpen] = useState(false);
    const [activeTemplate, setActiveTemplate] = useState<'passwordReset' | 'emailVerification'>('passwordReset');
    
    const TEMPLATE_PLACEHOLDERS = {
        passwordReset: ['{{name}}', '{{reset_link}}'],
        emailVerification: ['{{name}}', '{{verification_link}}'],
    };

    useEffect(() => {
        const fetchConfig = async () => {
            setIsLoading(true);
            const data = await api.getSmtpConfig();
            setConfig({ ...data, password: '' }); // Don't pre-fill password
            setIsLoading(false);
        };
        fetchConfig();
    }, []);

    const handleSave = async () => {
        if (isReadOnly || !config) return;
        setStatus(null);
        const result = await api.updateSmtpConfig(config);
        if (result.success) {
            setStatus({ type: 'success', text: t('smtpSettingsUpdateSuccess') });
        } else {
            setStatus({ type: 'error', text: t('smtpSettingsUpdateFailed') });
        }
        setTimeout(() => setStatus(null), 3000);
    };

    if (isLoading || !config) {
        return <div className="p-6 text-center">{t('loading')}...</div>;
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        let processedValue: string | number | boolean = value;
        if (type === 'number') processedValue = parseInt(value, 10);
        if (name === 'secure') processedValue = value === 'true';
        setConfig(prev => (prev ? { ...prev, [name]: processedValue } : null));
    };

    const handleTemplateChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setConfig(prev => {
            if (!prev) return null;
            return {
                ...prev,
                emailTemplates: {
                    ...prev.emailTemplates,
                    [activeTemplate]: {
                        ...prev.emailTemplates[activeTemplate],
                        [name]: value,
                    }
                }
            }
        });
    }

    return (
        <>
            <div className="space-y-8 max-w-3xl mx-auto">
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-6">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <Mail className="w-6 h-6 text-gray-500" />
                            <h2 className="text-xl font-bold text-gray-800">{t('smtpSettings')}</h2>
                        </div>
                        {!isReadOnly && (
                            <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-sm">
                                {t('saveChanges')}
                            </button>
                        )}
                    </div>

                    <p className="text-sm text-gray-600">{t('smtpSettingsDescription')}</p>
                    
                    {status && (
                        <p className={`text-sm p-3 rounded-md ${
                            status.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                        }`}>{status.text}</p>
                    )}

                    <div className="space-y-4 pt-4 border-t">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">{t('smtpHost')}</label>
                                <input name="host" type="text" value={config.host} onChange={handleChange} disabled={isReadOnly} className="mt-1 w-full bg-gray-50 border border-gray-300 rounded-md p-2 disabled:bg-gray-200 text-black" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">{t('smtpPort')}</label>
                                <input name="port" type="number" value={config.port} onChange={handleChange} disabled={isReadOnly} className="mt-1 w-full bg-gray-50 border border-gray-300 rounded-md p-2 disabled:bg-gray-200 text-black" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">{t('smtpSecurity')}</label>
                            <select name="secure" value={String(config.secure)} onChange={handleChange} disabled={isReadOnly} className="mt-1 w-full bg-gray-50 border border-gray-300 rounded-md p-2 disabled:bg-gray-200 text-black">
                                <option value="false">{t('smtpSecurityNone')}</option>
                                <option value="true">{t('smtpSecuritySslTls')}</option>
                            </select>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">{t('smtpUsername')}</label>
                                <input name="username" type="text" value={config.username} onChange={handleChange} disabled={isReadOnly} className="mt-1 w-full bg-gray-50 border border-gray-300 rounded-md p-2 disabled:bg-gray-200 text-black" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">{t('smtpPassword')}</label>
                                <input name="password" type="password" value={config.password} onChange={handleChange} placeholder={t('smtpPasswordPlaceholder')} disabled={isReadOnly} className="mt-1 w-full bg-gray-50 border border-gray-300 rounded-md p-2 disabled:bg-gray-200 text-black" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Email Templates */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-6">
                    <h3 className="text-lg font-semibold text-gray-800">{t('emailTemplates')}</h3>
                    <div className="flex flex-col md:flex-row gap-6">
                        <div className="md:w-1/3">
                            <label className="block text-sm font-medium text-gray-700 mb-2">{t('emailTemplate')}</label>
                            <div className="space-y-1">
                                <button onClick={() => setActiveTemplate('passwordReset')} className={`w-full text-start p-2 rounded-md transition-colors ${activeTemplate === 'passwordReset' ? 'bg-blue-100 text-blue-800' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'}`}>
                                    {t('templatePasswordReset')}
                                </button>
                                <button onClick={() => setActiveTemplate('emailVerification')} className={`w-full text-start p-2 rounded-md transition-colors ${activeTemplate === 'emailVerification' ? 'bg-blue-100 text-blue-800' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'}`}>
                                    {t('templateEmailVerification')}
                                </button>
                            </div>
                            <div className="mt-4">
                                <p className="text-sm font-medium text-gray-700">{t('placeholders')}:</p>
                                <div className="text-xs text-gray-500 mt-1 space-y-1">
                                    {TEMPLATE_PLACEHOLDERS[activeTemplate].map(ph => <p key={ph}><code>{ph}</code></p>)}
                                </div>
                            </div>
                        </div>
                        <div className="md:w-2/3 space-y-4">
                             <div>
                                <label className="block text-sm font-medium text-gray-700">{t('subject')}</label>
                                <input name="subject" value={config.emailTemplates[activeTemplate].subject} onChange={handleTemplateChange} disabled={isReadOnly} className="mt-1 w-full bg-gray-50 border border-gray-300 rounded-md p-2 disabled:bg-gray-200 text-black" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">{t('body')}</label>
                                <textarea name="body" value={config.emailTemplates[activeTemplate].body} onChange={handleTemplateChange} disabled={isReadOnly} rows={8} className="mt-1 w-full bg-gray-50 border border-gray-300 rounded-md p-2 resize-y disabled:bg-gray-200 text-black" />
                            </div>
                        </div>
                    </div>
                </div>

                {!isReadOnly && (
                    <div className="text-end">
                        <button onClick={() => setIsTestModalOpen(true)} className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-4 border border-gray-300 rounded-lg ms-auto">
                            <TestTube2 className="w-5 h-5"/>
                            <span>{t('sendTestEmail')}</span>
                        </button>
                    </div>
                )}
            </div>
            <TestEmailModal isOpen={isTestModalOpen} onClose={() => setIsTestModalOpen(false)} onSend={api.testSmtpConnection} />
        </>
    );
};