
import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '../types.ts';
import { User, Pyramid, Send, Trash2, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useTranslation } from '../i18n/i18n.tsx';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (message: string) => void;
  onClearChat: () => void;
  onFeedback: (messageId: string, feedback: 'good' | 'bad') => void;
  error: string | null;
  aiName: string;
  chatHeaderTitle: string;
  chatPlaceholder: string;
  aiAvatar: string | null;
}

const ChatBubble: React.FC<{ 
    message: ChatMessage; 
    onFeedback: (messageId: string, feedback: 'good' | 'bad') => void;
    aiAvatar: string | null;
}> = ({ message, onFeedback, aiAvatar }) => {
  const { t } = useTranslation();
  const isUser = message.sender === 'user';
  const bubbleClasses = isUser
    ? 'bg-blue-600 text-white self-end'
    : message.isError ? 'bg-red-100 text-red-900' : 'bg-gray-200 text-gray-800 self-start';
  
  const Icon = isUser ? User : Pyramid;
  const iconClasses = isUser ? 'text-blue-100' : 'text-blue-600';
  const iconBgClasses = isUser ? 'bg-blue-600' : 'bg-gray-100';

  const formattedTime = new Date(message.timestamp).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });

  const handleFeedbackClick = (feedback: 'good' | 'bad') => {
    if (!message.feedback) { // Only allow feedback once
        onFeedback(message.id, feedback);
    }
  };

  const containerClasses = [
    'flex',
    'items-start',
    'gap-3',
    'w-full',
    'max-w-xl',
    'animate-fade-in-up', // Ensures animation is applied to all bubbles
    isUser ? 'self-end flex-row-reverse' : 'self-start',
  ].join(' ');

  return (
    <div className={containerClasses}>
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${iconBgClasses}`}>
        {!isUser && aiAvatar ? (
            <img src={aiAvatar} alt="AI Avatar" className="w-full h-full rounded-full object-cover" />
        ) : (
            <Icon className={`w-5 h-5 ${iconClasses}`} />
        )}
      </div>
      <div className={`flex flex-col w-full ${isUser ? 'items-end' : 'items-start'}`}>
        <div
            className={`rounded-lg px-4 py-3 ${bubbleClasses} ${ message.isError ? 'border border-red-200' : ''}`}
        >
            <div style={{ whiteSpace: 'pre-wrap' }}>{message.text}</div>
            <div className={`text-xs mt-1.5 ${isUser ? 'text-blue-200/80 text-end' : 'text-gray-500/80 text-start'}`}>
                {formattedTime}
            </div>
        </div>
        {!isUser && !message.isError && (
            <div className="mt-1.5 flex gap-2">
                <button 
                    onClick={() => handleFeedbackClick('good')} 
                    disabled={!!message.feedback}
                    aria-label={t('feedbackGood')}
                    className={`p-1 rounded-full transition-colors ${
                        message.feedback === 'good' 
                        ? 'bg-green-100 text-green-700' 
                        : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:text-gray-400 disabled:hover:bg-transparent'
                    }`}
                >
                    <ThumbsUp className="w-4 h-4" />
                </button>
                    <button 
                    onClick={() => handleFeedbackClick('bad')} 
                    disabled={!!message.feedback}
                    aria-label={t('feedbackBad')}
                    className={`p-1 rounded-full transition-colors ${
                        message.feedback === 'bad' 
                        ? 'bg-red-100 text-red-700' 
                        : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:text-gray-400 disabled:hover:bg-transparent'
                    }`}
                >
                    <ThumbsDown className="w-4 h-4" />
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
    messages, 
    isLoading, 
    onSendMessage, 
    onClearChat, 
    onFeedback,
    aiName,
    chatHeaderTitle,
    chatPlaceholder,
    aiAvatar,
}) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      onSendMessage(inputValue);
      setInputValue('');
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e as unknown as React.FormEvent);
    }
  };

  const canClear = messages.length > 1;
  const showSampleQuestions = messages.length === 1 && messages[0].sender === 'atlas' && !isLoading;
  const sampleQuestionKeys = ['sampleQ1', 'sampleQ2', 'sampleQ3', 'sampleQ4'];

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex-shrink-0 p-2 sm:p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/60">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">{chatHeaderTitle}</h2>
          {isLoading ? (
            <p className="text-xs text-blue-600 animate-pulse">{t('chatTyping', { name: aiName })}</p>
          ) : (
            <p className="text-xs text-green-600">{t('chatOnline')}</p>
          )}
        </div>
        <button
          onClick={onClearChat}
          disabled={!canClear}
          title={t('chatClear')}
          aria-label={t('chatClear')}
          className="p-2 rounded-full text-gray-500 hover:bg-gray-200/50 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-500 transition-colors"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
      <div className="flex-grow p-2 md:p-6 space-y-6 overflow-y-auto flex flex-col no-scrollbar">
        {messages.map((msg) => (
          <ChatBubble key={msg.id} message={msg} onFeedback={onFeedback} aiAvatar={aiAvatar} />
        ))}

        {showSampleQuestions && (
            <div className="px-4 py-2 animate-fade-in-up">
                <h3 className="text-center text-sm font-semibold text-gray-500 mb-4">{t('quickQuestionsTitle')}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
                    {sampleQuestionKeys.map(key => (
                        <button
                            key={key}
                            onClick={() => onSendMessage(t(key))}
                            className="text-start p-3 bg-gray-100/80 hover:bg-gray-200/90 rounded-lg text-sm text-gray-700 transition-colors duration-200"
                        >
                            {t(key)}
                        </button>
                    ))}
                </div>
            </div>
        )}

        {isLoading && (
          <div className="flex items-start gap-3 w-full max-w-xl self-start animate-fade-in-up">
             <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gray-100">
                {aiAvatar ? (
                    <img src={aiAvatar} alt="AI Avatar" className="w-full h-full rounded-full object-cover" />
                ) : (
                    <Pyramid className="w-5 h-5 text-blue-600" />
                )}
            </div>
            <div className="rounded-lg px-4 py-3 bg-gray-200 self-start flex items-center gap-2">
                <span className="h-2 w-2 bg-blue-500 rounded-full animate-pulse [animation-delay:-0.3s]"></span>
                <span className="h-2 w-2 bg-blue-500 rounded-full animate-pulse [animation-delay:-0.15s]"></span>
                <span className="h-2 w-2 bg-blue-500 rounded-full animate-pulse"></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t border-gray-200 bg-white/80">
        <form onSubmit={handleSubmit} className="relative">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={chatPlaceholder}
            className="w-full bg-gray-100 border border-gray-300 rounded-lg py-3 ps-4 pe-14 text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none"
            rows={1}
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="absolute end-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200"
            aria-label={t('sendMessage')}
          >
            <Send className="w-5 h-5" fill="currentColor"/>
          </button>
        </form>
      </div>
    </div>
  );
};
