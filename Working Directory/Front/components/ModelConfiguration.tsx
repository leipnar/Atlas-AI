import React, { useState, useEffect } from 'react';
import type { ModelConfig } from '../types.ts';
import { ApiKeyInput } from './ApiKeyInput.tsx';
import { ModelSelector } from './ModelSelector.tsx';
import { useTranslation } from '../i18n/i18n.tsx';

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

            <div className="space-y-6 pt-4 border-t">
                <ApiKeyInput isReadOnly={isReadOnly} />
                <ModelSelector 
                    selectedModel={config.model} 
                    onModelChange={(model) => handleValueChange('model', model)} 
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
                    className="w-full bg-gray-50 border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 resize-y disabled:bg-gray-200"
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