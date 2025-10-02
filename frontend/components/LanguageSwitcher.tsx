import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from '../i18n/i18n.tsx';
import { Globe, ChevronDown } from 'lucide-react';

interface LanguageSwitcherProps {
    variant?: 'dark' | 'light';
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ variant = 'dark' }) => {
    const { language, setLanguage, t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleLanguageChange = (lang: 'en' | 'fa') => {
        setLanguage(lang);
        setIsOpen(false);
    };

    const buttonClasses = variant === 'dark'
        ? 'flex items-center gap-2 text-sm font-medium text-gray-200 hover:text-white p-2 rounded-lg'
        : 'flex items-center gap-2 text-sm font-medium text-gray-700 hover:bg-gray-100 p-2 rounded-lg';

    const dropdownClasses = variant === 'dark'
        ? 'bg-gray-800 border-white/10'
        : 'bg-white border-gray-200';
    
    const dropdownItemBase = 'w-full text-start px-4 py-2 text-sm';
    const dropdownItemDark = 'text-gray-200 hover:bg-white/10';
    const dropdownItemLight = 'text-gray-700 hover:bg-gray-100';


    return (
        <div className="relative" ref={wrapperRef}>
            <button onClick={() => setIsOpen(p => !p)} className={buttonClasses}>
                <Globe className="w-5 h-5" />
                <span className="hidden sm:inline">{language === 'fa' ? t('persian') : t('english')}</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className={`absolute end-0 mt-2 w-40 ${dropdownClasses} rounded-md shadow-lg border z-30`}>
                    <button
                        onClick={() => handleLanguageChange('en')}
                        className={`${dropdownItemBase} ${variant === 'dark' ? dropdownItemDark : dropdownItemLight} ${language === 'en' ? 'font-semibold' : ''}`}
                    >
                        {t('english')}
                    </button>
                    <button
                        onClick={() => handleLanguageChange('fa')}
                        className={`${dropdownItemBase} ${variant === 'dark' ? dropdownItemDark : dropdownItemLight} ${language === 'fa' ? 'font-semibold' : ''}`}
                    >
                        {t('persian')}
                    </button>
                </div>
            )}
        </div>
    );
};