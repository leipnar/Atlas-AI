import React, { useState, useEffect, useCallback } from 'react';
import * as api from '../services/apiService.ts';
import type { AllRolePermissions, UserRole } from '../types.ts';
import { useTranslation } from '../i18n/i18n.tsx';

const PERMISSION_LABELS: { [key: string]: string } = {
    canViewDashboard: 'permViewDashboard',
    canManageUsers: 'permManageUsers',
    canManageKnowledgeBase: 'permManageKnowledgeBase',
    canViewChatLogs: 'permViewChatLogs',
    canManageRoles: 'permManageRoles',
    canConfigureModel: 'permConfigureModel',
    canManageCompanyInfo: 'permManageCompanyInfo',
    canConfigureSmtp: 'permConfigureSmtp',
};

export const RoleManagement: React.FC = () => {
    const { t } = useTranslation();
    const [permissions, setPermissions] = useState<AllRolePermissions | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [saveStatus, setSaveStatus] = useState<string | null>(null);

    const fetchPermissions = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await api.getPermissions();
            setPermissions(result);
        } catch (err: any) {
            setError(err.message || "Failed to load permissions.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPermissions();
    }, [fetchPermissions]);

    const handlePermissionChange = (role: UserRole, permissionKey: string, value: boolean) => {
        if (!permissions) return;
        setPermissions(prev => ({
            ...prev!,
            [role]: {
                ...prev![role],
                [permissionKey]: value,
            }
        }));
    };

    const handleSave = async () => {
        if (!permissions) return;
        const result = await api.updatePermissions(permissions);
        if (result.success) {
            setSaveStatus(t('permissionsUpdateSuccess'));
        } else {
            setSaveStatus(t('permissionsUpdateFailed'));
        }
        setTimeout(() => setSaveStatus(null), 3000);
    };

    if (isLoading) {
        return <div className="text-center p-4">{t('permissionsLoading')}</div>;
    }
    if (error) {
        return <div className="text-center p-4 text-red-600">{error}</div>;
    }
    if (!permissions) {
        return null;
    }

    const rolesToManage = (Object.keys(permissions) as UserRole[]).filter(r => r !== 'admin' && r !== 'client');

    return (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
                 <h2 className="text-xl font-bold text-gray-800">{t('rolesTitle')}</h2>
                 <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-sm">{t('saveChanges')}</button>
            </div>
             {saveStatus && <p className="text-sm text-green-600 mb-4">{saveStatus}</p>}
            <p className="text-sm text-gray-500 mb-6">{t('rolesDescription')}</p>
            
            <div className="space-y-6">
                {rolesToManage.map(role => (
                    <div key={role} className="p-4 bg-gray-50 rounded-md border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-700 capitalize mb-3">{role}</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {Object.entries(permissions[role]).map(([key, value]) => (
                                <label key={key} className="flex items-center bg-white p-3 rounded-md border cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={value}
                                        onChange={(e) => handlePermissionChange(role, key, e.target.checked)}
                                        disabled={role === 'manager' && key === 'canManageRoles'}
                                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                    />
                                    <span className="text-sm text-gray-700 ms-3">{t(PERMISSION_LABELS[key] || key)}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};