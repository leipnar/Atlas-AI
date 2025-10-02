import React, { useState, useEffect, useRef } from 'react';
import * as api from '../services/apiService.ts';
import { useTranslation } from '../i18n/i18n.tsx';
import { Download, Upload, AlertTriangle, Cloud, CloudOff, Save, FileText, Database, Bot, LayoutDashboard } from 'lucide-react';
import { ConfirmationDialog } from './Header.tsx';
import type { BackupSchedule, GoogleDriveConfig, BackupType } from '../types.ts';

const BACKUP_ITEMS: { labelKey: string; descriptionKey: string; type: BackupType; icon: React.ElementType }[] = [
    { labelKey: 'backupTypePanel', descriptionKey: 'backupTypePanelDesc', type: 'panelConfig', icon: LayoutDashboard },
    { labelKey: 'backupTypeModel', descriptionKey: 'backupTypeModelDesc', type: 'modelConfig', icon: Bot },
    { labelKey: 'backupTypeKB', descriptionKey: 'backupTypeKBDesc', type: 'knowledgeBase', icon: Database },
    { labelKey: 'backupTypeDB', descriptionKey: 'backupTypeDBDesc', type: 'database', icon: FileText },
];

export const BackupAndRestore: React.FC = () => {
    const { t } = useTranslation();
    const [isExporting, setIsExporting] = useState<BackupType | 'full' | false>(false);
    const [isRestoring, setIsRestoring] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [backupFile, setBackupFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Automatic Backup State
    const [schedule, setSchedule] = useState<BackupSchedule | null>(null);
    const [driveConfig, setDriveConfig] = useState<GoogleDriveConfig | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            const [sched, drive] = await Promise.all([api.getBackupSchedule(), api.getGoogleDriveConfig()]);
            setSchedule(sched);
            setDriveConfig(drive);
        };
        fetchData();
    }, []);
    
    const handleExport = async (type: BackupType | 'full' = 'full') => {
        setIsExporting(type);
        setStatus(null);
        try {
            const data = await api.getBackupData(type);
            const jsonString = JSON.stringify(data, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            a.download = `atlas-backup-${type}-${timestamp}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (e) {
            setStatus({ type: 'error', text: t('backupExportFailed') });
        } finally {
            setIsExporting(false);
        }
    };
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type === 'application/json') {
            setBackupFile(file);
            setStatus(null);
        } else {
            setStatus({ type: 'error', text: t('backupInvalidFile') });
            setBackupFile(null);
        }
    };
    
    const handleRestoreClick = () => {
        if (backupFile) setIsConfirmOpen(true);
    };
    
    const confirmRestore = () => {
        if (!backupFile) return;
        setIsConfirmOpen(false);
        setIsRestoring(true);
        setStatus(null);
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = JSON.parse(e.target?.result as string);
                await api.restoreBackupData(data);
                setStatus({ type: 'success', text: t('backupRestoreSuccess') });
                setTimeout(() => window.location.reload(), 2000);
            } catch (err: any) {
                setStatus({ type: 'error', text: err.message || t('backupRestoreFailed') });
                setIsRestoring(false);
            }
        };
        reader.readAsText(backupFile);
    };

    const handleScheduleChange = (field: keyof BackupSchedule, value: any) => {
        setSchedule(prev => prev ? { ...prev, [field]: value } : null);
    };
    const handleSaveSchedule = async () => {
        if (schedule) {
            await api.updateBackupSchedule(schedule);
        }
    };

    const handleDriveConnect = async () => {
        const { config } = await api.connectGoogleDrive();
        setDriveConfig(config);
    };
    const handleDriveDisconnect = async () => {
        const { config } = await api.disconnectGoogleDrive();
        setDriveConfig(config);
        // Also update local schedule state to reflect disabled auto backups
        setSchedule(prev => prev ? { ...prev, enabled: false } : null);
    };

    return (
        <>
        <div className="space-y-8 max-w-3xl mx-auto">
            {/* Manual Backup */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 text-start">
                <h2 className="text-xl font-bold text-gray-800 mb-2">{t('backupExportTitle')}</h2>
                <p className="text-sm text-gray-600 mb-6">{t('backupExportDescription')}</p>
                <div className="space-y-4">
                    {BACKUP_ITEMS.map(item => {
                        const Icon = item.icon;
                        return (
                            <div key={item.type} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                                <div className="flex items-center gap-4">
                                    <Icon className="w-6 h-6 text-gray-500" />
                                    <div>
                                        <p className="font-semibold text-gray-800">{t(item.labelKey)}</p>
                                        <p className="text-xs text-gray-500">{t(item.descriptionKey)}</p>
                                    </div>
                                </div>
                                <button onClick={() => handleExport(item.type)} disabled={!!isExporting} className="flex items-center justify-center gap-2 bg-white hover:bg-gray-100 text-gray-700 font-semibold py-2 px-3 rounded-lg text-sm border border-gray-300 disabled:opacity-50">
                                   <Download className="w-4 h-4" />
                                   <span>{t('download')}</span>
                                </button>
                            </div>
                        )
                    })}
                     <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-4">
                            <Download className="w-6 h-6 text-blue-600" />
                            <div>
                                <p className="font-semibold text-blue-800">{t('exportData')}</p>
                                <p className="text-xs text-blue-600">{t('exportDataDesc')}</p>
                            </div>
                        </div>
                        <button onClick={() => handleExport('full')} disabled={!!isExporting} className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-sm disabled:opacity-50">
                            <span>{isExporting === 'full' ? t('exporting') : t('download')}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Automatic Backup */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 text-start">
                <h2 className="text-xl font-bold text-gray-800 mb-4">{t('automaticBackups')}</h2>
                <div className="space-y-4">
                    {/* Google Drive Connect */}
                    <div>
                        <h3 className="text-md font-semibold text-gray-700">{t('cloudStorage')}</h3>
                        <div className="flex items-center gap-4 p-4 mt-2 bg-gray-50 rounded-lg">
                           {driveConfig?.connected ? (
                                <>
                                    <Cloud className="w-6 h-6 text-green-600"/>
                                    <div className="flex-grow">
                                        <p className="text-sm font-medium text-gray-800">{t('connectedAs', { email: driveConfig.email })}</p>
                                    </div>
                                    <button onClick={handleDriveDisconnect} className="text-sm text-red-600 hover:underline">{t('disconnectGoogleDrive')}</button>
                                </>
                           ) : (
                                <>
                                    <CloudOff className="w-6 h-6 text-gray-400"/>
                                    <p className="flex-grow text-sm text-gray-600">{t('notConnected')}</p>
                                    <button onClick={handleDriveConnect} className="text-sm font-semibold text-blue-600 hover:underline">{t('connectGoogleDrive')}</button>
                                </>
                           )}
                        </div>
                    </div>
                    {/* Schedule Settings */}
                    <div className={`space-y-4 pt-4 border-t ${!driveConfig?.connected ? 'opacity-50' : ''}`}>
                         <h3 className="text-md font-semibold text-gray-700">{t('backupSchedule')}</h3>
                         {!driveConfig?.connected && <p className="text-xs text-orange-600 bg-orange-50 p-2 rounded-md">{t('googleDriveRequiredForAutoBackup')}</p>}
                         <div className="flex items-center justify-between">
                            <label htmlFor="enable-backup" className="font-medium text-gray-700">{t('enableAutomaticBackups')}</label>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" id="enable-backup" className="sr-only peer" checked={schedule?.enabled || false} onChange={e => handleScheduleChange('enabled', e.target.checked)} disabled={!driveConfig?.connected}/>
                                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                         </div>
                         <div className={`space-y-4 ${!schedule?.enabled ? 'opacity-50' : ''}`}>
                             <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">{t('frequency')}</label>
                                    <select value={schedule?.frequency} onChange={e => handleScheduleChange('frequency', e.target.value)} disabled={!schedule?.enabled} className="mt-1 w-full bg-gray-50 border border-gray-300 rounded-md p-2 text-sm">
                                        <option value="daily">{t('daily')}</option>
                                        <option value="weekly">{t('weekly')}</option>
                                    </select>
                                </div>
                                {schedule?.frequency === 'weekly' && (
                                     <div>
                                        <label className="block text-sm font-medium text-gray-700">{t('dayOfWeek')}</label>
                                        <select value={schedule?.dayOfWeek} onChange={e => handleScheduleChange('dayOfWeek', parseInt(e.target.value))} disabled={!schedule?.enabled} className="mt-1 w-full bg-gray-50 border border-gray-300 rounded-md p-2 text-sm">
                                            {Array.from({length: 7}, (_, i) => <option key={i} value={i}>{t(`days.${i}`)}</option>)}
                                        </select>
                                    </div>
                                )}
                                 <div>
                                    <label className="block text-sm font-medium text-gray-700">{t('time')}</label>
                                    <input type="time" value={schedule?.time} onChange={e => handleScheduleChange('time', e.target.value)} disabled={!schedule?.enabled} className="mt-1 w-full bg-gray-50 border border-gray-300 rounded-md p-2 text-sm"/>
                                </div>
                             </div>
                         </div>
                         <div className="text-end">
                            <button onClick={handleSaveSchedule} disabled={!driveConfig?.connected} className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-3 rounded-lg shadow-sm text-sm disabled:bg-gray-400 ms-auto">
                                <Save className="w-4 h-4" />
                                <span>{t('saveChanges')}</span>
                            </button>
                         </div>
                    </div>
                </div>
            </div>

            {/* Restore Section */}
            <div className="bg-white rounded-lg border-2 border-red-300 shadow-sm p-6 text-start">
                 <div className="flex items-center gap-3">
                    <AlertTriangle className="w-6 h-6 text-red-500" />
                    <h2 className="text-xl font-bold text-gray-800">{t('backupRestoreTitle')}</h2>
                </div>
                <p className="text-sm text-red-700 bg-red-50 p-3 rounded-md my-4">{t('backupRestoreWarning')}</p>
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="application/json"/>
                    <button onClick={() => fileInputRef.current?.click()} className="flex-shrink-0 flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg shadow-sm">
                        <Upload className="w-5 h-5"/>
                        <span>{t('selectFile')}</span>
                    </button>
                    {backupFile && <p className="text-sm text-gray-700 truncate">{backupFile.name}</p>}
                </div>
                <div className="mt-6 text-end">
                    <button onClick={handleRestoreClick} disabled={!backupFile || isRestoring} className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg shadow-sm disabled:bg-gray-400 disabled:cursor-not-allowed ms-auto">
                        <Upload className="w-5 h-5"/>
                        <span>{isRestoring ? t('restoring') : t('restoreData')}</span>
                    </button>
                </div>
            </div>

            {status && (
                <p className={`text-sm p-3 rounded-md mt-4 ${status.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{status.text}</p>
            )}
        </div>
        <ConfirmationDialog 
            isOpen={isConfirmOpen}
            title={t('backupRestoreConfirmTitle')}
            message={t('backupRestoreConfirmMessage')}
            onConfirm={confirmRestore}
            onCancel={() => setIsConfirmOpen(false)}
            confirmText={t('restore')}
        />
        </>
    );
};