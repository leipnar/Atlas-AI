import React, { useState, useEffect, useMemo } from 'react';
import type { AllRolePermissions, RolePermissions, UserRole } from '../types.ts';
import * as api from '../services/apiService.ts';
import { useTranslation } from '../i18n/i18n.tsx';
import { USER_ROLES } from '../constants.ts';
import { Info } from 'lucide-react';

// --- Sub-components for the new design ---

const PermissionToggle: React.FC<{
    label: string;
    description: string;
    isChecked: boolean;
    onChange: (checked: boolean) => void;
}> = ({ label, description, isChecked, onChange }) => {
    const id = `perm-${label.replace(/\s+/g, '-')}`;
    return (
        <div className="flex items-center justify-between py-3">
            <div className="rtl:text-right">
                <label htmlFor={id} className="font-medium text-gray-800 cursor-pointer">{label}</label>
                <p className="text-sm text-gray-500">{description}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
                <input
                    id={id}
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => onChange(e.target.checked)}
                    className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:bg-blue-600 peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] rtl:after:right-[2px] rtl:after:left-auto after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full"></div>
            </label>
        </div>
    );
};

// --- Main Component ---

const PERMISSION_GROUPS: Record<string, (keyof RolePermissions)[]> = {
    general: ['canViewDashboard'],
    userManagement: ['canManageUsers', 'canManageRoles', 'canImportUsers'],
    contentAndAI: ['canManageKB', 'canViewModelConfig', 'canEditModelConfig'],
    systemSettings: ['canViewCompanySettings', 'canEditCompanySettings', 'canCustomizePanel', 'canViewSmtpSettings', 'canEditSmtpSettings', 'canManageBackups'],
    monitoring: ['canViewChatLogs'],
};

export const RoleManagement: React.FC = () => {
    const { t } = useTranslation();
    const [permissions, setPermissions] = useState<AllRolePermissions | null>(null);
    const [initialPermissions, setInitialPermissions] = useState<AllRolePermissions | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [status, setStatus] = useState<string | null>(null);
    const [selectedRole, setSelectedRole] = useState<UserRole>('supervisor');

    useEffect(() => {
        const fetchPermissions = async () => {
            setIsLoading(true);
            try {
                const perms = await api.getPermissions();
                setPermissions(perms);
                setInitialPermissions(JSON.parse(JSON.stringify(perms))); // Deep copy
            } catch (err: any) {
                setError(err.message || 'Failed to load permissions.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchPermissions();
    }, []);

    const handlePermissionChange = (role: UserRole, perm: keyof RolePermissions, value: boolean) => {
        setPermissions(prev => {
            if (!prev) return null;
            return {
                ...prev,
                [role]: { ...prev[role], [perm]: value }
            };
        });
    };

    const handleSaveChanges = async () => {
        if (!permissions) return;
        setStatus(null);
        setError(null);
        try {
            await api.updatePermissions(permissions);
            setInitialPermissions(JSON.parse(JSON.stringify(permissions)));
            setStatus(t('modelSettingsUpdateSuccess')); // Re-using a generic success message
            setTimeout(() => setStatus(null), 3000);
        } catch (e) {
            setError('Failed to save permissions.');
        }
    };

    const hasChanges = useMemo(() => {
        return JSON.stringify(permissions) !== JSON.stringify(initialPermissions);
    }, [permissions, initialPermissions]);

    if (isLoading) {
        return <div className="p-4 text-center">{t('loading')}...</div>;
    }
    if (error || !permissions) {
        return <div className="p-4 text-center text-red-600">{error || 'No permissions data available.'}</div>;
    }

    const editableRoles = USER_ROLES.filter(role => !['admin', 'manager'].includes(role));

    return (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4 border-b pb-4">
                <h2 className="text-xl font-bold text-gray-800">{t('roleManagement')}</h2>
                <button 
                    onClick={handleSaveChanges} 
                    disabled={!hasChanges}
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    {t('saveChanges')}
                </button>
            </div>
            {status && <p className="text-sm text-green-700 bg-green-50 p-3 rounded-md mb-4">{status}</p>}
            
            <div className="flex items-center gap-3 p-3 mb-6 bg-blue-50 border border-blue-200 rounded-lg">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <p className="text-sm text-blue-800">{t('fixedPermissionsInfo')}</p>
            </div>

            <div className="flex flex-col md:flex-row md:rtl:flex-row-reverse gap-8">
                {/* Vertical Role Navigation */}
                <nav className="flex flex-row md:flex-col md:w-48 flex-shrink-0 -mx-2 md:mx-0">
                    {editableRoles.map(role => (
                        <button
                            key={role}
                            onClick={() => setSelectedRole(role)}
                            className={`w-full text-start px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                                selectedRole === role ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                            {t(`roles.${role}`)}
                        </button>
                    ))}
                </nav>

                {/* Permissions for Selected Role */}
                <div className="flex-grow min-w-0">
                    <div className="space-y-6">
                        {Object.entries(PERMISSION_GROUPS).map(([groupKey, permKeys]) => (
                            <div key={groupKey} className="border border-gray-200 rounded-lg">
                                <h3 className="text-lg font-semibold text-gray-800 px-4 py-3 bg-gray-50 border-b rounded-t-lg">
                                    {t(`permissionGroup.${groupKey}`)}
                                </h3>
                                <div className="divide-y divide-gray-200 px-4">
                                    {permKeys
                                      .filter(permKey => Object.prototype.hasOwnProperty.call(permissions[selectedRole], permKey))
                                      .map(permKey => (
                                        <PermissionToggle
                                            key={permKey}
                                            label={t(`perm.${permKey}`)}
                                            description={t(`permDesc.${permKey}`)}
                                            isChecked={permissions[selectedRole][permKey as keyof RolePermissions]}
                                            onChange={(value) => handlePermissionChange(selectedRole, permKey as keyof RolePermissions, value)}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};