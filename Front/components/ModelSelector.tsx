import React from 'react';
// Fix: Add .ts extension to imports
import type { SupportedModel } from '../types.ts';
import { AVAILABLE_MODELS } from '../constants.ts';
import { useTranslation } from '../i18n/i18n.tsx';

interface ModelSelectorProps {
  selectedModel: SupportedModel;
  onModelChange: (model: SupportedModel) => void;
  isReadOnly: boolean;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({ selectedModel, onModelChange, isReadOnly }) => {
  const { t } = useTranslation();
  return (
    <div>
      <label htmlFor="model-selector" className="block text-sm font-medium text-gray-700 mb-2">
        {t('languageModelLabel')}
      </label>
      <select
        id="model-selector"
        value={selectedModel}
        onChange={(e) => onModelChange(e.target.value as SupportedModel)}
        className="w-full bg-gray-50 border border-gray-300 rounded-md py-2 px-3 text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 disabled:bg-gray-200 disabled:cursor-not-allowed"
        disabled={isReadOnly}
      >
        {AVAILABLE_MODELS.map((group) => (
          <optgroup key={group.provider} label={group.provider}>
            {group.models.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  );
};