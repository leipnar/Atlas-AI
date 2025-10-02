

import React, { useState, useEffect } from 'react';
import { KeyRound } from 'lucide-react';
import * as api from '../services/apiService.ts';
import { ConfirmationDialog } from './Header.tsx';
import { useTranslation } from '../i18n/i18n.tsx';

interface ApiKeyInputProps {
    isReadOnly: boolean;
}

export const ApiKeyInput: React.FC<ApiKeyInputProps> = ({ isReadOnly }) => {
  const { t } = useTranslation();
  const [apiKey, setApiKey] = useState('');
  const [isKeySet, setIsKeySet] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  useEffect(() => {
    const fetchKeyStatus = async () => {
      setIsLoading(true);
      // FIX: Replaced `api.isApiKeySet` and `api.getApiKey` with `api.getApiKeys` to align with the multi-provider API service, specifically targeting the Google key.
      const keys = await api.getApiKeys();
      setIsKeySet(!!keys.google);
      if (!isReadOnly) {
        setApiKey(keys.google || '');
      }
      setIsLoading(false);
    };
    fetchKeyStatus();
  }, [isReadOnly]);

  const handleSave = () => {
      if (!isReadOnly) {
          setIsConfirmOpen(true);
      }
  };
  
  const confirmSave = async () => {
      // FIX: Replaced `api.setApiKey` with `api.setApiKeys` to align with the multi-provider API service, specifically targeting the Google key.
      const result = await api.setApiKeys({ google: apiKey });
      if (result.success) {
          setIsKeySet(!!apiKey);
          setSaveStatus(t('apiKeySaveSuccess'));
          setTimeout(() => setSaveStatus(null), 3000);
      } else {
          setSaveStatus(t('apiKeySaveFailed'));
      }
      setIsConfirmOpen(false);
  }

  if (isLoading) {
      return <div>{t('apiKeyStatusLoading')}</div>;
  }
  
  if (isReadOnly) {
      return (
         <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('geminiApiKey')}
          </label>
          <div className="flex items-center gap-3 bg-gray-50 border border-gray-300 rounded-md p-3">
            <KeyRound className={`w-5 h-5 ${isKeySet ? 'text-green-500' : 'text-orange-500'}`} />
            <div className="flex flex-col">
              <p className={`text-sm font-semibold ${isKeySet ? 'text-green-700' : 'text-orange-700'}`}>
                {isKeySet ? t('apiKeyConfigured') : t('apiKeyNotSet')}
              </p>
              <p className="text-xs text-gray-500">
                {t('apiKeyAdminConfigured')}
              </p>
            </div>
          </div>
        </div>
      )
  }

  return (
    <>
      <div>
        <label htmlFor="api-key" className="block text-sm font-medium text-gray-700 mb-2">
          {t('geminiApiKey')}
        </label>
        <div className="flex gap-2">
            <input
              id="api-key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={t('apiKeyPlaceholder')}
              className="w-full bg-gray-50 border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 text-black"
            />
            <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-sm">
                {t('save')}
            </button>
        </div>
        {saveStatus && <p className="text-sm text-green-600 mt-2">{saveStatus}</p>}
        <p className="text-xs text-gray-500 mt-2">{t('apiKeyDescription')}</p>
      </div>
      <ConfirmationDialog 
        isOpen={isConfirmOpen}
        title={t('apiKeyConfirmTitle')}
        message={t('apiKeyConfirmMessage')}
        onConfirm={confirmSave}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </>
  );
};