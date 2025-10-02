import React, { useState, useEffect } from 'react';
import type { SupportedModelId, ModelProvider, CustomOpenRouterModel } from '../types.ts';
import { AVAILABLE_MODELS } from '../constants.ts';
import { useTranslation } from '../i18n/i18n.tsx';
import * as api from '../services/apiService.ts';

interface ModelSelectorProps {
  selectedModelId: SupportedModelId;
  onModelChange: (provider: ModelProvider, modelId: SupportedModelId) => void;
  isReadOnly: boolean;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({ selectedModelId, onModelChange, isReadOnly }) => {
  const { t } = useTranslation();
  const [customModels, setCustomModels] = useState<CustomOpenRouterModel[]>([]);

  useEffect(() => {
      const fetchCustomModels = async () => {
          const models = await api.getCustomOpenRouterModels();
          setCustomModels(models);
      };
      fetchCustomModels();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const [provider, modelId] = e.target.value.split(':') as [ModelProvider, SupportedModelId];
    onModelChange(provider, modelId);
  };

  // Find the combined value for the current selection
  let selectedValue = '';
  // Check standard models first
  for (const group of AVAILABLE_MODELS) {
    for (const model of group.models) {
      if (model.id === selectedModelId) {
        selectedValue = `${group.provider}:${model.id}`;
        break;
      }
    }
    if (selectedValue) break;
  }
  // If not found, check custom models
  if (!selectedValue) {
      for (const model of customModels) {
          if (model.id === selectedModelId) {
              selectedValue = `openrouter:${model.id}`;
              break;
          }
      }
  }


  return (
    <div>
      <label htmlFor="model-selector" className="block text-sm font-medium text-gray-700 mb-2">
        {t('languageModelLabel')}
      </label>
      <select
        id="model-selector"
        value={selectedValue}
        onChange={handleChange}
        className="w-full bg-gray-50 border border-gray-300 rounded-md py-2 px-3 text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 disabled:bg-gray-200 disabled:cursor-not-allowed"
        disabled={isReadOnly}
      >
        {AVAILABLE_MODELS.map((group) => (
          <optgroup key={group.name} label={group.name}>
            {group.models.map((model) => (
              <option key={model.id} value={`${group.provider}:${model.id}`}>
                {model.name}
              </option>
            ))}
          </optgroup>
        ))}
        {customModels.length > 0 && (
            <optgroup label="OpenRouter (Custom)">
                {customModels.map((model) => (
                    <option key={model.id} value={`openrouter:${model.id}`}>
                        {model.name}
                    </option>
                ))}
            </optgroup>
        )}
      </select>
    </div>
  );
};