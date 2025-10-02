import React from 'react';
import { useTranslation } from '../i18n/i18n.tsx';

interface FooterProps {
    onNavigateToPrivacy: () => void;
    onNavigateToTerms: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigateToPrivacy, onNavigateToTerms }) => {
    const { t } = useTranslation();
    return (
        <footer className="w-full flex-shrink-0 bg-white py-3 px-4 sm:px-6 lg:px-8 text-start text-xs text-gray-500 border-t border-gray-200">
            <div className="flex justify-between items-center">
                <p>{t('copyright', { year: new Date().getFullYear().toString() })}</p>
                <div className="flex gap-4">
                    <button onClick={onNavigateToPrivacy} className="hover:text-gray-800 hover:underline">{t('privacyPolicy')}</button>
                    <button onClick={onNavigateToTerms} className="hover:text-gray-800 hover:underline">{t('termsOfService')}</button>
                </div>
            </div>
        </footer>
    );
};