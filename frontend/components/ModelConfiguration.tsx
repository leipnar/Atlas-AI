import React, { useState, useEffect } from 'react';
import type { ModelConfig, ApiKeys, ModelProvider, SupportedModelId, CustomOpenRouterModel } from '../types.ts';
import * as api from '../services/apiService.ts';
import { ModelSelector } from './ModelSelector.tsx';
import { useTranslation } from '../i18n/i18n.tsx';
import { KeyRound, Plus, Edit, Trash2 } from 'lucide-react';
import { ConfirmationDialog } from './Header.tsx';

interface ModelConfigurationProps {
    initialConfig: ModelConfig;
    onSave: (config: ModelConfig) => Promise<{ success: boolean }>;
    isReadOnly: boolean;
}

const SettingsSlider: React.FC<{
    label: string;
    description: string;
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
    isReadOnly: boolean;
}> = ({ label, description, value, onChange, min = 0, max = 1, step = 0.1, isReadOnly }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        <p className="text-xs text-gray-500 mb-2">{description}</p>
        <div className="flex items-center gap-4">
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(parseFloat(e.target.value))}
                disabled={isReadOnly}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer disabled:cursor-not-allowed"
            />
            <span className="text-sm font-semibold text-gray-700 w-12 text-center">{value.toFixed(1)}</span>
        </div>
    </div>
);

const CustomModelModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (model: CustomOpenRouterModel) => Promise<{ success: boolean; message?: string }>;
    modelToEdit: CustomOpenRouterModel | null;
}> = ({ isOpen, onClose, onSave, modelToEdit }) => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({ id: '', name: '' });
    const [errors, setErrors] = useState<{ id?: string; name?: string, form?: string }>({});

    useEffect(() => {
        if (isOpen) {
            setFormData(modelToEdit ? { ...modelToEdit } : { id: '', name: '' });
            setErrors({});
        }
    }, [modelToEdit, isOpen]);
    
    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name as keyof typeof errors]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };

    const validate = () => {
        const newErrors: { id?: string; name?: string } = {};
        if (!formData.id.trim()) newErrors.id = t('modelIdRequired');
        if (!formData.name.trim()) newErrors.name = t('modelNameRequired');
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) return;
        const result = await onSave(formData);
        if (result.success) {
            onClose();
        } else {
            setErrors({ form: result.message || 'An unknown error occurred.' });
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md text-start">
                <div className="p-6 border-b"><h2 className="text-xl font-bold text-gray-800">{modelToEdit ? t('editCustomModel') : t('addCustomModel')}</h2></div>
                <div className="p-6 space-y-4">
                    {errors.form && <p className="text-sm p-3 rounded-md bg-red-50 text-red-700">{errors.form}</p>}
                     <div>
                        <label className="text-sm font-medium text-gray-700">{t('customModelId')}</label>
                        <input name="id" value={formData.id} onChange={handleChange} className="mt-1 w-full bg-gray-50 border border-gray-300 rounded-md p-2 text-black" placeholder={t('customModelIdPlaceholder')}/>
                        {errors.id && <p className="text-xs text-red-500 mt-1">{errors.id}</p>}
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700">{t('customModelName')}</label>
                        <input name="name" value={formData.name} onChange={handleChange} className="mt-1 w-full bg-gray-50 border border-gray-300 rounded-md p-2 text-black" placeholder={t('customModelNamePlaceholder')}/>
                        {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                    </div>
                </div>
                <div className="flex justify-end gap-3 p-4 bg-gray-50 border-t">
                    <button onClick={onClose} className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-4 border border-gray-300 rounded-lg">{t('cancel')}</button>
                    <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg">{t('save')}</button>
                </div>
            </div>
        </div>
    );
};


const CustomModelManager: React.FC<{ isReadOnly: boolean }> = ({ isReadOnly }) => {
    const { t } = useTranslation();
    const [models, setModels] = useState<CustomOpenRouterModel[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modelToEdit, setModelToEdit] = useState<CustomOpenRouterModel | null>(null);
    const [modelToDelete, setModelToDelete] = useState<CustomOpenRouterModel | null>(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    
    const fetchModels = async () => {
        const data = await api.getCustomOpenRouterModels();
        setModels(data);
    };
    
    useEffect(() => {
        fetchModels();
    }, []);
    
    const handleSave = async (modelData: CustomOpenRouterModel) => {
        const result = modelToEdit
            ? await api.updateCustomOpenRouterModel(modelToEdit.id, modelData)
            : await api.addCustomOpenRouterModel(modelData);
        
        if (result.success) fetchModels();
        return result;
    };
    
    const handleDelete = (model: CustomOpenRouterModel) => {
        setModelToDelete(model);
        setIsConfirmOpen(true);
    };

    const confirmDelete = async () => {
        if (modelToDelete) {
            await api.deleteCustomOpenRouterModel(modelToDelete.id);
            fetchModels();
        }
        setIsConfirmOpen(false);
        setModelToDelete(null);
    };

    return (
        <>
        <div className="mt-4 pt-4 border-t">
            <h4 className="text-md font-semibold text-gray-800">{t('openRouterCustomModels')}</h4>
            <p className="text-xs text-gray-500 mb-3">{t('openRouterCustomModelsDesc')}</p>
            <div className="space-y-2">
                {models.map(model => (
                    <div key={model.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                        <div>
                            <p className="font-medium text-sm text-gray-800">{model.name}</p>
                            <p className="text-xs text-gray-500 font-mono">{model.id}</p>
                        </div>
                        {!isReadOnly && (
                        <div className="flex gap-2">
                            <button onClick={() => { setModelToEdit(model); setIsModalOpen(true); }} className="p-1 text-gray-500 hover:text-blue-600"><Edit className="w-4 h-4" /></button>
                            <button onClick={() => handleDelete(model)} className="p-1 text-gray-500 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                        </div>
                        )}
                    </div>
                ))}
            </div>
             {!isReadOnly && (
                <button onClick={() => { setModelToEdit(null); setIsModalOpen(true); }} className="mt-3 flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-500">
                    <Plus className="w-4 h-4" /> {t('addCustomModel')}
                </button>
             )}
        </div>
        <CustomModelModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSave={handleSave}
            modelToEdit={modelToEdit}
        />
        <ConfirmationDialog
            isOpen={isConfirmOpen}
            title={t('customModelDeleteTitle')}
            message={t('customModelDeleteMessage', { name: modelToDelete?.name || '' })}
            onConfirm={confirmDelete}
            onCancel={() => setIsConfirmOpen(false)}
            confirmText={t('delete')}
        />
        </>
    );
};


const ApiKeyManager: React.FC<{ isReadOnly: boolean }> = ({ isReadOnly }) => {
    const { t } = useTranslation();
    const [keys, setKeys] = useState<ApiKeys>({ google: '', openai: '', openrouter: '' });
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<keyof ApiKeys>('google');

    useEffect(() => {
        const fetchKeys = async () => {
            setIsLoading(true);
            const fetchedKeys = await api.getApiKeys();
            setKeys(fetchedKeys);
            setIsLoading(false);
        };
        fetchKeys();
    }, []);
    
    const handleKeyChange = (provider: keyof ApiKeys, value: string) => {
        setKeys(prev => ({...prev, [provider]: value}));
    };

    const handleSaveKeys = async () => {
        await api.setApiKeys({ [activeTab]: keys[activeTab] });
        // Maybe show a success message
    };

    if (isLoading) {
        return <div>{t('apiKeyStatusLoading')}</div>;
    }

    const tabButtonClasses = (tabName: keyof ApiKeys) => 
        `px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
            activeTab === tabName 
            ? 'bg-white border-b-0 text-blue-600' 
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`;

    return (
        <div className="pt-4 border-t">
            <h3 className="text-lg font-semibold text-gray-800">{t('geminiApiKey')}s</h3>
            <div className="mt-2">
                <div className="flex border-b -mb-px">
                    <button onClick={() => setActiveTab('google')} className={tabButtonClasses('google')}>Google</button>
                    <button onClick={() => setActiveTab('openai')} className={tabButtonClasses('openai')}>OpenAI</button>
                    <button onClick={() => setActiveTab('openrouter')} className={tabButtonClasses('openrouter')}>OpenRouter</button>
                </div>
                <div className="p-4 border border-t-0 rounded-b-lg">
                    {Object.keys(keys).map(keyStr => {
                        const key = keyStr as keyof ApiKeys;
                        return (
                        <div key={key} style={{ display: activeTab === key ? 'block' : 'none' }}>
                             <label className="block text-sm font-medium text-gray-700 capitalize">{key} API Key</label>
                             <div className="flex gap-2 mt-1">
                                <input
                                    type="password"
                                    value={keys[key]}
                                    onChange={e => handleKeyChange(key, e.target.value)}
                                    disabled={isReadOnly}
                                    placeholder={t('apiKeyPlaceholder')}
                                    className="w-full bg-gray-50 border border-gray-300 rounded-md p-2 text-sm text-black disabled:bg-gray-200"
                                />
                                {!isReadOnly && (
                                    <button onClick={handleSaveKeys} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-3 rounded-lg shadow-sm">
                                        {t('save')}
                                    </button>
                                )}
                             </div>
                             {key === 'openrouter' && <CustomModelManager isReadOnly={isReadOnly} />}
                        </div>
                    )})}
                </div>
            </div>
        </div>
    );
};


export const ModelConfiguration: React.FC<ModelConfigurationProps> = ({ initialConfig, onSave, isReadOnly }) => {
    const { t } = useTranslation();
    const [config, setConfig] = useState(initialConfig);
    const [status, setStatus] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        setConfig(initialConfig);
    }, [initialConfig]);
    
    const hasChanges = JSON.stringify(config) !== JSON.stringify(initialConfig);

    const handleSave = async () => {
        setStatus(null);
        if (isReadOnly || !hasChanges) return;

        const result = await onSave(config);
        if (result.success) {
            setStatus({ type: 'success', text: t('modelSettingsUpdateSuccess') });
        } else {
            setStatus({ type: 'error', text: t('modelSettingsUpdateFailed') });
        }
        setTimeout(() => setStatus(null), 3000);
    };
    
    const handleValueChange = <K extends keyof ModelConfig>(key: K, value: ModelConfig[K]) => {
        setConfig(prev => ({...prev, [key]: value }));
    };

    const handleModelSelectionChange = (provider: ModelProvider, modelId: SupportedModelId) => {
        setConfig(prev => ({...prev, provider, model: modelId }));
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">{t('modelConfigTitle')}</h2>
                {!isReadOnly && (
                    <button onClick={handleSave} disabled={!hasChanges} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-sm disabled:bg-gray-400 disabled:cursor-not-allowed">
                        {t('saveChanges')}
                    </button>
                )}
            </div>
            {status && (
                <p className={`text-sm p-3 rounded-md ${status.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{status.text}</p>
            )}

            <ApiKeyManager isReadOnly={isReadOnly} />
            
            <div className="space-y-6 pt-4 border-t">
                <ModelSelector 
                    selectedModelId={config.model} 
                    onModelChange={handleModelSelectionChange} 
                    isReadOnly={isReadOnly} 
                />
            </div>
            
            <div className="space-y-6 pt-4 border-t">
                 <h3 className="text-lg font-semibold text-gray-800">{t('customInstruction')}</h3>
                 <p className="text-sm text-gray-600 -mt-4">{t('customInstructionDescription')}</p>
                 <textarea
                    value={config.customInstruction}
                    onChange={(e) => handleValueChange('customInstruction', e.target.value)}
                    disabled={isReadOnly}
                    rows={4}
                    className="w-full bg-gray-50 border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 resize-y disabled:bg-gray-200 text-black"
                    placeholder="e.g., Always start responses with 'Hello!'..."
                 />
            </div>

            <div className="space-y-6 pt-4 border-t">
                 <h3 className="text-lg font-semibold text-gray-800">{t('modelSettingsTitle')}</h3>
                 <SettingsSlider 
                    label={t('temperature')}
                    description={t('temperatureDescription')}
                    value={config.temperature}
                    onChange={(val) => handleValueChange('temperature', val)}
                    isReadOnly={isReadOnly}
                 />
                 <SettingsSlider 
                    label={t('topP')}
                    description={t('topPDescription')}
                    value={config.topP}
                    onChange={(val) => handleValueChange('topP', val)}
                    isReadOnly={isReadOnly}
                 />
                 <SettingsSlider 
                    label={t('topK')}
                    description={t('topKDescription')}
                    value={config.topK}
                    onChange={(val) => handleValueChange('topK', val)}
                    min={1}
                    max={100}
                    step={1}
                    isReadOnly={isReadOnly}
                 />
            </div>
        </div>
    );
};