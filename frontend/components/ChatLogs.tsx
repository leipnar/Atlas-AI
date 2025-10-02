

import React, { useState, useEffect, useCallback, useRef } from 'react';
import * as api from '../services/apiService.ts';
import type { ConversationSummary, Conversation } from '../types.ts';
import { Pyramid, ChevronDown, User } from 'lucide-react';
import { useTranslation } from '../i18n/i18n.tsx';


// Declare jsPDF types for TypeScript
declare const jspdf: any;

export const ChatLogs: React.FC = () => {
    const { t } = useTranslation();
    const [logs, setLogs] = useState<ConversationSummary[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [isExportOpen, setIsExportOpen] = useState(false);
    const exportButtonRef = useRef<HTMLDivElement>(null);
    
    const fetchLogs = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await api.getChatLogs({ page, limit: 10, search: searchQuery });
            setLogs(result.logs);
            setTotalPages(result.totalPages);
        } catch (err: any) {
            setError(err.message || t('logsError'));
        } finally {
            setIsLoading(false);
        }
    }, [page, searchQuery, t]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (exportButtonRef.current && !exportButtonRef.current.contains(event.target as Node)) {
                setIsExportOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleViewConversation = async (logId: string) => {
        const fullConvo = await api.getConversation(logId);
        setSelectedConversation(fullConvo);
    };

    const formatDate = (timestamp: number) => new Date(timestamp).toLocaleString();

    const exportToTxt = () => {
        if (!selectedConversation) return;
        const { user, messages } = selectedConversation;
        let content = `${t('conversationWith', { name: `${user.firstName} ${user.lastName}` })}\n`;
        content += `User: ${user.username} (${user.email})\n`;
        content += `${t('ipAddress')}: ${user.ip}\n`;
        content += `Date: ${formatDate(selectedConversation.startTime)}\n\n`;
        content += '----------------------------------------\n\n';

        messages.forEach(msg => {
            const sender = msg.sender === 'user' ? user.firstName : t('appName');
            const time = new Date(msg.timestamp).toLocaleTimeString();
            content += `[${time}] ${sender}:\n${msg.text}\n\n`;
        });

        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chatlog_${user.username}_${selectedConversation.id}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setIsExportOpen(false);
    };

    const exportToPdf = () => {
        if (!selectedConversation) return;
        setIsExporting(true);
        const { user, messages } = selectedConversation;
        const { jsPDF } = jspdf;
        const doc = new jsPDF();
        
        doc.setFontSize(18);
        doc.text(t('conversationWith', { name: `${user.firstName} ${user.lastName}` }), 14, 22);

        doc.setFontSize(10);
        doc.text(`User: ${user.username} (${user.email})`, 14, 30);
        doc.text(`${t('ipAddress')}: ${user.ip}`, 14, 35);
        doc.text(`Date: ${formatDate(selectedConversation.startTime)}`, 14, 40);

        const tableColumn = [t('sender'), t('message'), t('time')];
        const tableRows: (string | null)[][] = messages.map(msg => [
            msg.sender === 'user' ? user.firstName : t('appName'),
            msg.text,
            new Date(msg.timestamp).toLocaleTimeString()
        ]);

        (doc as any).autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 50,
        });

        doc.save(`chatlog_${user.username}_${selectedConversation.id}.pdf`);
        setIsExporting(false);
        setIsExportOpen(false);
    };

    if (selectedConversation) {
        return (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col h-full">
                <div className="flex-shrink-0 p-4 border-b border-gray-200 flex flex-wrap gap-4 justify-center sm:justify-between items-center">
                    <button onClick={() => setSelectedConversation(null)} className="text-sm font-medium text-blue-600 hover:text-blue-500">
                        {t('backToLogs')}
                    </button>
                    <div className="text-center">
                        <h3 className="font-semibold text-gray-800">{t('conversationWith', { name: `${selectedConversation.user.firstName} ${selectedConversation.user.lastName}` })}</h3>
                        <p className="text-xs text-gray-500">{selectedConversation.user.username} | {t('ipAddress')}: {selectedConversation.user.ip}</p>
                    </div>
                    <div className="relative" ref={exportButtonRef}>
                        <button onClick={() => setIsExportOpen(p => !p)} disabled={isExporting} className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-3 rounded-lg text-sm">
                            {isExporting ? t('loading') : t('export')} <ChevronDown className="w-4 h-4" />
                        </button>
                        {isExportOpen && (
                            <div className="absolute end-0 mt-2 w-40 bg-white rounded-md shadow-lg border z-10">
                                <button onClick={exportToTxt} className="block w-full text-start px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">{t('exportAsTxt')}</button>
                                <button onClick={exportToPdf} className="block w-full text-start px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">{t('exportAsPdf')}</button>
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex-grow p-4 md:p-6 space-y-6 overflow-y-auto no-scrollbar">
                    {selectedConversation.messages.map(msg => (
                        <div key={msg.id} className={`flex items-start gap-3 w-full max-w-xl ${msg.sender === 'user' ? 'ms-auto flex-row-reverse' : 'me-auto'}`}>
                            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${msg.sender === 'user' ? 'bg-blue-600' : 'bg-gray-100'}`}>
                                {msg.sender === 'user' ? <User className="w-5 h-5 text-white"/> : <Pyramid className="w-5 h-5 text-blue-600"/>}
                            </div>
                            <div className="rounded-lg px-4 py-3 bg-gray-100">
                                <p className="text-sm text-gray-800 whitespace-pre-wrap">{msg.text}</p>
                                <p className={`text-xs mt-1.5 text-gray-400 ${msg.sender === 'user' ? 'text-end' : 'text-start'}`}>{new Date(msg.timestamp).toLocaleTimeString()}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    
    return (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">{t('chatLogsTitle')}</h2>
            <input
                type="text"
                placeholder={t('chatLogsSearchPlaceholder')}
                value={searchQuery}
                onChange={(e) => {setSearchQuery(e.target.value); setPage(1);}}
                className="w-full max-w-sm bg-gray-50 border border-gray-300 rounded-md p-2 ps-4 text-sm mb-4 text-black"
            />

            {isLoading ? <div className="text-center p-4">{t('logsLoading')}</div> :
             error ? <div className="text-center p-4 text-red-600">{error}</div> :
             logs.length === 0 ? <div className="text-center p-4 text-gray-500">{t('logsNotFound')}</div> : (
                <div className="space-y-3">
                    {logs.map(log => (
                        <div key={log.id} className="grid grid-cols-1 md:grid-cols-4 items-center gap-4 p-3 bg-gray-50 rounded-md border border-gray-200">
                            <div className="md:col-span-1">
                                <p className="font-semibold text-gray-800">{log.user.firstName} {log.user.lastName}</p>
                                <p className="text-xs text-gray-500">{log.user.username}</p>
                            </div>
                            <div className="md:col-span-2">
                                <p className="text-sm text-gray-600 truncate">"{log.firstMessage}"</p>
                                <p className="text-xs text-gray-400 mt-1">{formatDate(log.startTime)}</p>
                            </div>
                            <div className="md:col-span-1 flex items-center justify-end gap-4">
                                <span className="text-sm text-gray-500">{t('messagesCount', { count: log.messageCount.toString() })}</span>
                                <button onClick={() => handleViewConversation(log.id)} className="bg-blue-100 text-blue-700 hover:bg-blue-200 text-sm font-semibold py-1 px-3 rounded-full">{t('view')}</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
            {totalPages > 1 && (
                <div className="flex justify-between items-center mt-6">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="px-4 py-2 text-sm bg-gray-200 rounded-md disabled:opacity-50">{t('previous')}</button>
                    <span className="text-sm text-gray-600">{t('pageIndicator', { page: page.toString(), totalPages: totalPages.toString() })}</span>
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-4 py-2 text-sm bg-gray-200 rounded-md disabled:opacity-50">{t('next')}</button>
                </div>
            )}
        </div>
    );
};