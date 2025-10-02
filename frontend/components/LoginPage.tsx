

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Pyramid, KeyRound } from 'lucide-react';
import * as api from '../services/apiService.ts';
import { useTranslation } from '../i18n/i18n.tsx';
import { MicrosoftIcon } from './icons/MicrosoftIcon.tsx';
import { GoogleIcon } from './icons/GoogleIcon.tsx';

interface LoginPageProps {
  onLogin: (username: string, password: string) => Promise<{ success: boolean; message?: string }>;
  onSocialLogin: (provider: 'google' | 'microsoft') => Promise<{ success: boolean; message?: string }>;
  onNavigateToPrivacy: () => void;
  onNavigateToTerms: () => void;
}

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minutes

const ForgotPasswordModal: React.FC<{isOpen: boolean; onClose: () => void;}> = ({ isOpen, onClose }) => {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setEmail('');
            setSubmitted(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitted(true);
    };

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-60 flex items-center justify-center z-50">
             <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm m-4">
                <h2 className="text-xl font-bold text-gray-800 mb-4">{t('resetPasswordTitle')}</h2>
                {submitted ? (
                    <div>
                        <p className="text-gray-600 mb-6">{t('resetPasswordSuccess')}</p>
                        <button onClick={onClose} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-sm">{t('close')}</button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <p className="text-sm text-gray-600">{t('resetPasswordInstructions')}</p>
                        <div>
                            <label htmlFor="email-reset" className="block text-sm font-medium text-gray-700 mb-1">{t('emailAddressLabel')}</label>
                            <input id="email-reset" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full bg-gray-50 border border-gray-300 rounded-md p-2 text-sm text-black"/>
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                             <button type="button" onClick={onClose} className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-4 border border-gray-300 rounded-lg shadow-sm">{t('cancel')}</button>
                             <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-sm">{t('sendLinkButton')}</button>
                        </div>
                    </form>
                )}
             </div>
        </div>
    );
};

const PasskeyLoginModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (username: string) => void;
    isLoading: boolean;
}> = ({ isOpen, onClose, onConfirm, isLoading }) => {
    const { t } = useTranslation();
    const [username, setUsername] = useState('');

    useEffect(() => {
        if (isOpen) {
            setUsername('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleConfirm = () => {
        if (username.trim()) {
            onConfirm(username);
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-60 flex items-center justify-center z-[60]">
             <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm m-4 text-start">
                <h2 className="text-xl font-bold text-gray-800 mb-4">{t('passkeyLoginTitle')}</h2>
                <div className="space-y-4">
                    <p className="text-sm text-gray-600">{t('passkeyUsernamePrompt')}</p>
                    <div>
                        <label htmlFor="passkey-username" className="block text-sm font-medium text-gray-700 mb-1">{t('usernameLabel')}</label>
                        <input
                            id="passkey-username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            className="w-full bg-gray-50 border border-gray-300 rounded-md p-2 text-sm text-black"
                            autoComplete="username webauthn"
                            onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                         <button type="button" onClick={onClose} disabled={isLoading} className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-4 border border-gray-300 rounded-lg shadow-sm">{t('cancel')}</button>
                         <button type="button" onClick={handleConfirm} disabled={isLoading || !username.trim()} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-sm disabled:bg-gray-400">
                             {isLoading ? t('loggingIn') : t('continueButton')}
                         </button>
                    </div>
                </div>
             </div>
        </div>
    );
};


export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onSocialLogin, onNavigateToPrivacy, onNavigateToTerms }) => {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{ username?: string; password?: string }>({});
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutMessage, setLockoutMessage] = useState('');
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [isPasskeyModalOpen, setIsPasskeyModalOpen] = useState(false);
  const intervalRef = useRef<number | null>(null);

  const clearLockoutInterval = () => {
      if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
      }
  };

  const startLockoutTimer = useCallback((endTime: number) => {
    clearLockoutInterval();
    const updateTimer = () => {
        const remaining = Math.max(0, endTime - Date.now());
        if (remaining === 0) {
            setIsLocked(false);
            setLockoutMessage('');
            sessionStorage.removeItem('lockoutUntil');
            clearLockoutInterval();
        } else {
            setIsLocked(true);
            const minutes = Math.floor(remaining / 60000);
            const seconds = Math.floor((remaining % 60000) / 1000);
            setLockoutMessage(t('lockoutMessage', { minutes: minutes.toString(), seconds: seconds.toString().padStart(2, '0') }));
        }
    };
    updateTimer();
    intervalRef.current = window.setInterval(updateTimer, 1000);
  }, [t]);

  useEffect(() => {
    const lockoutUntil = sessionStorage.getItem('lockoutUntil');
    if (lockoutUntil) {
        const endTime = parseInt(lockoutUntil, 10);
        if (endTime > Date.now()) {
            startLockoutTimer(endTime);
        } else {
            sessionStorage.removeItem('lockoutUntil');
        }
    }
    return () => clearLockoutInterval();
  }, [startLockoutTimer]);
  
  const handleFailedLoginAttempt = () => {
    const currentAttempts = parseInt(sessionStorage.getItem('loginAttempts') || '0', 10) + 1;
    if (currentAttempts >= MAX_LOGIN_ATTEMPTS) {
      const endTime = Date.now() + LOCKOUT_DURATION_MS;
      sessionStorage.setItem('lockoutUntil', endTime.toString());
      sessionStorage.removeItem('loginAttempts');
      startLockoutTimer(endTime);
    } else {
      sessionStorage.setItem('loginAttempts', currentAttempts.toString());
    }
  };

  const validateInputs = () => {
    const newErrors: { username?: string; password?: string } = {};
    let isValid = true;
    if (!username.trim()) {
      newErrors.username = t('usernameRequired');
      isValid = false;
    }
    if (!password.trim()) {
      newErrors.password = t('passwordRequired');
      isValid = false;
    }
    setValidationErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked || isLoading) return;
    if (validateInputs()) {
      setIsLoading(true);
      setError(null);
      const result = await onLogin(username, password);
      setIsLoading(false);
      if (!result.success) {
        setError(result.message || t('invalidCredentials'));
        handleFailedLoginAttempt();
      } else {
        sessionStorage.removeItem('loginAttempts');
      }
    }
  };
  
  const handlePasskeyLogin = async (passkeyUsername: string) => {
    setIsLoading(true);
    setError(null);

    const passkeyAuthResult = await api.loginWithPasskey(passkeyUsername);
    
    if (passkeyAuthResult.success) {
        const result = await onLogin(passkeyUsername, 'passkey_authenticated');
        if (!result.success) {
            setError(result.message || t('invalidCredentials'));
        }
    } else {
        setError(passkeyAuthResult.message || t('passkeyLoginFailed'));
    }
    
    setIsLoading(false);
    setIsPasskeyModalOpen(false);
  };

  const handleSocialLoginClick = async (provider: 'google' | 'microsoft') => {
      setIsLoading(true);
      setError(null);
      await onSocialLogin(provider);
      setIsLoading(false);
  }

  const baseInputClasses = "w-full bg-white border rounded-md p-3 text-black text-sm focus:ring-2 transition-all duration-200 placeholder:text-gray-500";
  const normalInputClasses = "border-gray-300 focus:ring-blue-500 focus:border-blue-500";
  const errorInputClasses = "border-red-500 focus:ring-red-500 focus:border-red-500";
  
  const socialButtonClasses = "w-full flex items-center justify-center gap-2 bg-white text-gray-700 font-semibold py-2.5 px-4 rounded-lg border border-gray-300 hover:bg-gray-100 transition-all duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500 disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed";
  
  const renderAgreementText = () => {
    const agreementText = t('loginAgreement');
    const termsLink = <button type="button" key="terms" onClick={onNavigateToTerms} className="font-medium underline hover:text-white">{t('termsOfService')}</button>;
    const privacyLink = <button type="button" key="privacy" onClick={onNavigateToPrivacy} className="font-medium underline hover:text-white">{t('privacyPolicy')}</button>;
    
    // Split the string by placeholders, keeping the delimiters
    const parts = agreementText.split(/%(TERMS|PRIVACY)%/);

    return parts.map((part, index) => {
        if (part === 'TERMS') return termsLink;
        if (part === 'PRIVACY') return privacyLink;
        return <React.Fragment key={index}>{part}</React.Fragment>;
    });
  };

  return (
    <>
      <div className="p-8">
        <div className="flex flex-col items-center mb-6">
            <Pyramid className="w-16 h-16 text-white/90 mb-4" />
            <h1 className="text-3xl font-bold text-white tracking-wider">{t('loginTitle')}</h1>
            <p className="text-gray-300">{t('loginSubtitle')}</p>
        </div>
      
        <div className="flex flex-col gap-3">
            <button onClick={() => handleSocialLoginClick('google')} disabled={isLocked || isLoading} className={socialButtonClasses}>
                <GoogleIcon className="w-5 h-5" />
                <span>{t('signInWithGoogle')}</span>
            </button>
             <button onClick={() => handleSocialLoginClick('microsoft')} disabled={isLocked || isLoading} className={socialButtonClasses}>
                <MicrosoftIcon className="w-5 h-5" />
                <span>{t('signInWithMicrosoft')}</span>
            </button>
        </div>

        <div className="flex items-center my-4">
            <div className="flex-grow border-t border-white/20"></div>
            <span className="flex-shrink mx-4 text-gray-400 text-xs">{t('orSeparator')}</span>
            <div className="flex-grow border-t border-white/20"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-200 mb-2">{t('usernameLabel')}</label>
            <input id="username" type="text" value={username} onChange={(e) => { setUsername(e.target.value); if (validationErrors.username) setValidationErrors(p => ({...p, username: undefined})); }} required disabled={isLocked || isLoading} className={`${baseInputClasses} ${validationErrors.username ? errorInputClasses : normalInputClasses}`} autoComplete="username webauthn"/>
            {validationErrors.username && <p className="text-sm text-red-400 mt-1">{validationErrors.username}</p>}
            </div>
            
            <div>
                <div className="flex justify-between items-center mb-2">
                    <label htmlFor="password" className="block text-sm font-medium text-gray-200">{t('passwordLabel')}</label>
                    <button type="button" onClick={() => setIsForgotModalOpen(true)} className="text-xs font-medium text-blue-400 hover:text-blue-300">{t('forgotPassword')}</button>
                </div>
            <input id="password" type="password" value={password} onChange={(e) => { setPassword(e.target.value); if (validationErrors.password) setValidationErrors(p => ({...p, password: undefined})); }} required disabled={isLocked || isLoading} className={`${baseInputClasses} ${validationErrors.password ? errorInputClasses : normalInputClasses}`} autoComplete="current-password"/>
            {validationErrors.password && <p className="text-sm text-red-400 mt-1">{validationErrors.password}</p>}
            </div>
            
            {lockoutMessage && <p className="text-sm text-center text-yellow-300 bg-yellow-500/20 p-3 rounded-md border border-yellow-500/30">{lockoutMessage}</p>}
            {error && !lockoutMessage && <p className="text-sm text-red-300 bg-red-500/20 p-3 rounded-md border border-red-500/30">{error}</p>}

            <div className="pt-2 space-y-3">
            <button type="submit" disabled={isLocked || isLoading} className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500 transition-all duration-200 disabled:bg-gray-500 disabled:cursor-not-allowed">
                {isLoading ? t('loggingIn') : isLocked ? t('locked') : t('loginButton')}
            </button>
             <button
                type="button"
                onClick={() => setIsPasskeyModalOpen(true)}
                disabled={isLocked || isLoading}
                className="w-full flex items-center justify-center gap-2 bg-gray-700 text-white font-bold py-3 px-4 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500 transition-all duration-200 disabled:bg-gray-500 disabled:cursor-not-allowed"
            >
                <KeyRound className="w-5 h-5" />
                <span>{t('loginWithPasskey')}</span>
            </button>
            </div>
        </form>
        <p className="text-center text-xs text-gray-400 mt-6 px-4">
            {renderAgreementText()}
        </p>
      </div>
      <ForgotPasswordModal isOpen={isForgotModalOpen} onClose={() => setIsForgotModalOpen(false)} />
      <PasskeyLoginModal 
        isOpen={isPasskeyModalOpen}
        onClose={() => setIsPasskeyModalOpen(false)}
        onConfirm={handlePasskeyLogin}
        isLoading={isLoading}
      />
    </>
  );
};