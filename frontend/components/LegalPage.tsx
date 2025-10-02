
import React from 'react';
import { ArrowLeft, ArrowRight, Pyramid } from 'lucide-react';
import { useTranslation } from '../i18n/i18n.tsx';
import { Footer } from './Footer.tsx';

interface LegalPageProps {
  title: string;
  contentEn: string;
  contentFa: string;
  onBack: () => void;
  companyName: string;
  logo: string | null;
  onNavigateToPrivacy: () => void;
  onNavigateToTerms: () => void;
}

export const LegalPage: React.FC<LegalPageProps> = ({ title, contentEn, contentFa, onBack, companyName, logo, onNavigateToPrivacy, onNavigateToTerms }) => {
    const { t, language } = useTranslation();
    const content = language === 'fa' ? contentFa : contentEn;

    return (
        <div className="flex flex-col h-screen bg-slate-100">
            <header className="flex-shrink-0 bg-white border-b border-gray-200 shadow-sm z-10">
                <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                        {logo ? (
                           <img src={logo} alt="Logo" className="h-8 w-auto object-contain" />
                        ) : (
                           <Pyramid className="w-8 h-8 text-blue-600" />
                        )}
                        <h1 className="text-xl font-bold text-gray-800 hidden sm:block">{companyName}</h1>
                    </div>
                    <button onClick={onBack} className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-blue-600 p-2 rounded-lg">
                        {language === 'fa' ? <ArrowRight className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5" />}
                        <span>{t('back')}</span>
                    </button>
                </div>
            </header>
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                <div className="max-w-4xl mx-auto bg-white p-6 sm:p-8 rounded-lg shadow-sm border">
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 border-b pb-4">{title}</h2>
                    <div className="max-w-none text-start text-slate-800 leading-relaxed whitespace-pre-wrap">
                        {content}
                    </div>
                </div>
            </main>
            <Footer onNavigateToPrivacy={onNavigateToPrivacy} onNavigateToTerms={onNavigateToTerms} />
        </div>
    );
};
