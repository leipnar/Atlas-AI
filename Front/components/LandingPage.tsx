import React from 'react';
import { LoginPage } from './LoginPage.tsx';
import type { CompanyInfo } from '../types.ts';
import { Pyramid } from 'lucide-react';
import { useTranslation } from '../i18n/i18n.tsx';

interface LandingPageProps {
  onLogin: (username: string, password: string) => Promise<{ success: boolean; message?: string }>;
  companyInfo: CompanyInfo;
}

const LanguageSwitcher: React.FC = () => {
    const { language, setLanguage } = useTranslation();

    return (
        <div className="absolute top-6 end-6 z-20 bg-black/20 backdrop-blur-sm border border-white/10 rounded-full p-1 text-sm">
            <button 
                onClick={() => setLanguage('en')}
                className={`px-3 py-1 rounded-full transition-colors ${language === 'en' ? 'bg-white/20 text-white' : 'text-gray-300 hover:text-white'}`}
            >
                EN
            </button>
            <button 
                onClick={() => setLanguage('fa')}
                className={`px-3 py-1 rounded-full transition-colors ${language === 'fa' ? 'bg-white/20 text-white' : 'text-gray-300 hover:text-white'}`}
            >
                FA
            </button>
        </div>
    );
};


export const LandingPage: React.FC<LandingPageProps> = ({ onLogin, companyInfo }) => {
    const { t, language } = useTranslation();
    const fontClass = language === 'fa' ? 'font-vazir' : 'font-sans';
    const companyLocale = companyInfo[language] || companyInfo.en;
    
    return (
        <div className={`relative h-screen w-full overflow-y-auto md:overflow-hidden bg-gray-900 ${fontClass}`}>
            {/* Animated Background Blobs */}
            <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-600 rounded-full mix-blend-lighten filter blur-xl opacity-70 animate-blob"></div>
            <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-600 rounded-full mix-blend-lighten filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-600 rounded-full mix-blend-lighten filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
            
            <LanguageSwitcher />

            <div className="relative z-10 flex flex-col md:flex-row h-full w-full">
                {/* Left Info Panel */}
                <div className="flex w-full md:w-1/2 flex-col justify-center p-8 sm:p-12 lg:p-24 text-white">
                    <div className="animate-fade-in-up">
                        {companyInfo.logo ? (
                            <img src={companyInfo.logo} alt={`${companyLocale.name} Logo`} className="h-20 w-auto mb-8 object-contain" />
                        ) : (
                             <Pyramid className="w-20 h-20 mb-8 text-white" />
                        )}
                        <h1 className="text-4xl lg:text-5xl font-bold tracking-wider mb-4 leading-tight">{companyLocale.name}</h1>
                        <p className="text-lg text-gray-200/90 leading-relaxed max-w-lg">
                            {companyLocale.about}
                        </p>
                    </div>
                </div>

                {/* Right Login Panel */}
                <div className="w-full md:w-1/2 flex flex-col items-center justify-center p-4 sm:p-6">
                    {/* Glassmorphism Container */}
                    <div className="w-full max-w-md bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
                         <LoginPage onLogin={onLogin} />
                    </div>
                     {/* Footer for mobile view, appears below login form */}
                    <footer className="w-full p-4 text-center text-xs text-gray-400/70 md:hidden">
                        <p>{t('copyright', { year: new Date().getFullYear().toString() })}</p>
                    </footer>
                </div>
            </div>
             {/* Footer for desktop view, absolutely positioned */}
            <footer className="absolute bottom-6 start-12 z-10 hidden md:block text-start text-xs text-gray-400/70">
                <p>{t('copyright', { year: new Date().getFullYear().toString() })}</p>
            </footer>
        </div>
    );
};