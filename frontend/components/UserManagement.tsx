

import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { UserCredentials, UserRole, RolePermissions } from '../types';
import * as api from '../services/apiService.ts';
import { Plus, Edit, Trash2, ChevronDown, Check, X, Upload } from 'lucide-react';
import { SortIcon } from './icons/SortIcon';
import { ConfirmationDialog } from './Header';
import { useTranslation } from '../i18n/i18n';
import { USER_ROLES } from '../constants';

type SortConfig = {
    key: keyof UserCredentials;
    direction: 'asc' | 'desc' | null;
};

// --- User Form Modal ---
const UserFormModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (user: UserCredentials) => Promise<{ success: boolean; message?: string }>;
    userToEdit: UserCredentials | null;
    currentUser: UserCredentials;
}> = ({ isOpen, onClose, onSave, userToEdit, currentUser }) => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState<UserCredentials>({
        username: '', password: '', firstName: '', lastName: '', email: '', mobile: '', role: 'client', emailVerified: false, ip: '', device: '', os: ''
    });
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const manageableRoles = USER_ROLES.filter(role => {
        if (currentUser.role === 'admin') return true;
        if (currentUser.role === 'manager' && role !== 'admin') return true;
        if (currentUser.role === 'supervisor' && !['admin', 'manager'].includes(role)) return true;
        return false;
    });

    useEffect(() => {
        if (isOpen) {
            setFormData(userToEdit ? { ...userToEdit, password: '' } : {
                username: '', password: '', firstName: '', lastName: '', email: '', mobile: '', role: 'client', emailVerified: false, ip: '', device: '', os: ''
            });
            setErrors({});
        }
    }, [userToEdit, isOpen]);
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };
    
    const handleRoleSelect = (role: UserRole) => {
        setFormData(prev => ({ ...prev, role }));
        setIsDropdownOpen(false);
    };

    const validate = () => {
        const newErrors: { [key: string]: string } = {};
        if (!formData.username.trim()) newErrors.username = t('usernameRequired');
        else if (!/^[a-zA-Z0-9_.-]+$/.test(formData.username)) newErrors.username = t('usernameInvalidFormat');
        if (!userToEdit && !formData.password) newErrors.password = t('passwordRequired');
        if (!formData.firstName.trim()) newErrors.firstName = t('firstNameRequired');
        if (!formData.lastName.trim()) newErrors.lastName = t('lastNameRequired');
        if (!formData.email.trim()) newErrors.email = t('emailRequired');
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) return;
        const result = await onSave(formData);
        if (result.success) {
            onClose();
        } else {
            const message = result.message || 'An unknown error occurred.';
            if (message.toLowerCase().includes('username')) {
                 setErrors({ username: message });
            } else {
                 setErrors({ form: message });
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg text-start flex flex-col max-h-full">
                <div className="p-6 border-b">
                    <h2 className="text-xl font-bold text-gray-800">{userToEdit ? t('editUser') : t('addUser')}</h2>
                </div>
                <div className="p-6 space-y-4">
                    {errors.form && <p className="text-sm p-3 rounded-md bg-red-50 text-red-700">{errors.form}</p>}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div>
                            <label className="text-sm font-medium text-gray-700">{t('usernameLabel')}</label>
                            <input name="username" value={formData.username} onChange={handleChange} disabled={!!userToEdit} className="mt-1 w-full bg-gray-50 border border-gray-300 rounded-md p-2 disabled:bg-gray-200 text-black"/>
                            {errors.username && <p className="text-xs text-red-500 mt-1">{errors.username}</p>}
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700">{t('passwordLabel')}</label>
                            <input name="password" type="password" value={formData.password} onChange={handleChange} placeholder={userToEdit ? t('passwordPlaceholderOptional') : ''} className="mt-1 w-full bg-gray-50 border border-gray-300 rounded-md p-2 text-black"/>
                            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
                        </div>
                         <div>
                            <label className="text-sm font-medium text-gray-700">{t('firstName')}</label>
                            <input name="firstName" value={formData.firstName} onChange={handleChange} className="mt-1 w-full bg-gray-50 border border-gray-300 rounded-md p-2 text-black"/>
                            {errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName}</p>}
                        </div>
                         <div>
                            <label className="text-sm font-medium text-gray-700">{t('lastName')}</label>
                            <input name="lastName" value={formData.lastName} onChange={handleChange} className="mt-1 w-full bg-gray-50 border border-gray-300 rounded-md p-2 text-black"/>
                             {errors.lastName && <p className="text-xs text-red-500 mt-1">{errors.lastName}</p>}
                        </div>
                    </div>
                     <div>
                        <label className="text-sm font-medium text-gray-700">{t('email')}</label>
                        <input name="email" type="email" value={formData.email} onChange={handleChange} className="mt-1 w-full bg-gray-50 border border-gray-300 rounded-md p-2 text-black"/>
                         {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700">{t('mobile')}</label>
                        <input name="mobile" value={formData.mobile} onChange={handleChange} className="mt-1 w-full bg-gray-50 border border-gray-300 rounded-md p-2 text-black"/>
                    </div>
                    <div ref={dropdownRef} className="relative">
                        <label className="text-sm font-medium text-gray-700">{t('role')}</label>
                        <button onClick={() => setIsDropdownOpen(p => !p)} className="mt-1 w-full flex justify-between items-center bg-gray-50 border border-gray-300 rounded-md p-2 text-start">
                            <span>{t(`roles.${formData.role}`)}</span>
                            <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isDropdownOpen && (
                            <div className="absolute top-full mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg z-20">
                                {manageableRoles.map(role => (
                                    <button key={role} onClick={() => handleRoleSelect(role)} className="w-full text-start px-3 py-2 text-black hover:bg-gray-100">{t(`roles.${role}`)}</button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex justify-end gap-3 p-4 bg-gray-50 border-t">
                    <button onClick={onClose} className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-4 border border-gray-300 rounded-lg">{t('cancel')}</button>
                    <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg">{t('save')}</button>
                </div>
            </div>
        </div>
    );
};

// --- Import Users Modal ---
const ImportUsersModal: React.FC<{ isOpen: boolean; onClose: () => void; onImport: () => void }> = ({ isOpen, onClose, onImport }) => {
    const { t } = useTranslation();
    const [file, setFile] = useState<File | null>(null);
    const [summary, setSummary] = useState<{ new: number, update: number, errors: string[] } | null>(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile && selectedFile.type === 'text/csv') {
            setFile(selectedFile);
            analyzeFile(selectedFile);
        } else {
            setFile(null);
            setSummary(null);
        }
    };
    
    const analyzeFile = (fileToAnalyze: File) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            const content = e.target?.result as string;
            const lines = content.split('\n').filter(line => line.trim() !== '');
            if (lines.length <= 1) { // Header only
                setSummary({ new: 0, update: 0, errors: [t('importCsvEmpty')] });
                return;
            }

            const existingUsersResult = await api.getUsers({ page: 1, limit: 1000 }); // Fetch all users for check
            const existingUsernames = new Set(existingUsersResult.users.map(u => u.username.toLowerCase()));
            
            let newCount = 0;
            let updateCount = 0;
            const errors: string[] = [];

            for (let i = 1; i < lines.length; i++) {
                const [username] = lines[i].split(',');
                if (!username || username.trim() === '') {
                    errors.push(t('importCsvErrorLine', { line: i+1, error: 'Username is missing' }));
                    continue;
                }
                if (existingUsernames.has(username.trim().toLowerCase())) {
                    updateCount++;
                } else {
                    newCount++;
                }
            }
            setSummary({ new: newCount, update: updateCount, errors });
        };
        reader.readAsText(fileToAnalyze);
    };

    const handleImportClick = () => {
        if (summary && summary.errors.length === 0) {
            setIsConfirmOpen(true);
        }
    };

    const confirmImport = async () => {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (e) => {
            const content = e.target?.result as string;
            const lines = content.split('\n').filter(line => line.trim() !== '').slice(1);
            const usersToImport: UserCredentials[] = lines.map(line => {
                const [username, password, firstName, lastName, email, mobile, role] = line.split(',');
                return { username, password, firstName, lastName, email, mobile, role: role as UserRole, emailVerified: false, ip: '', device: '', os: '' };
            });
            await api.importUsers(usersToImport);
            onImport();
            onClose();
        };
        reader.readAsText(file);
    };

    const downloadSample = () => {
        const header = "username,password,firstName,lastName,email,mobile,role\n";
        const example = "john.doe,SecurePass123,John,Doe,john.doe@example.com,555-1234,client\n";
        const content = header + example;
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'user_import_sample.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    if (!isOpen) return null;

    return (
        <>
        <div className="fixed inset-0 bg-gray-900 bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg text-start">
                <div className="p-6 border-b"><h2 className="text-xl font-bold text-gray-800">{t('importUsers')}</h2></div>
                <div className="p-6 space-y-4">
                    <p className="text-sm text-gray-600">{t('importUsersDesc')}</p>
                    <button onClick={downloadSample} className="text-sm text-blue-600 hover:underline">{t('downloadSampleCsv')}</button>
                    
                    <div onClick={() => fileInputRef.current?.click()} className="mt-4 flex justify-center items-center w-full h-32 px-6 border-2 border-gray-300 border-dashed rounded-md cursor-pointer hover:bg-gray-50">
                        <div className="text-center">
                            <Upload className="mx-auto h-8 w-8 text-gray-400" />
                            <p className="mt-1 text-sm text-gray-600">{file ? file.name : t('selectCsvFile')}</p>
                        </div>
                    </div>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".csv, text/csv"/>
                    
                    {summary && (
                        <div className="p-4 bg-gray-50 rounded-md border text-sm">
                            <h3 className="font-semibold mb-2">{t('importSummary')}</h3>
                            <div className="space-y-1">
                                <p>{t('importNewUsers', { count: summary.new.toString() })}</p>
                                <p>{t('importUpdateUsers', { count: summary.update.toString() })}</p>
                            </div>
                            {summary.errors.length > 0 && (
                                <div className="mt-2 pt-2 border-t">
                                    <p className="font-semibold text-red-600">{t('importErrorsFound')}:</p>
                                    <ul className="list-disc list-inside text-red-600 text-xs">
                                        {summary.errors.slice(0, 5).map((err, i) => <li key={i}>{err}</li>)}
                                        {summary.errors.length > 5 && <li>...</li>}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <div className="flex justify-end gap-3 p-4 bg-gray-50 border-t">
                    <button onClick={onClose} className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-4 border border-gray-300 rounded-lg">{t('cancel')}</button>
                    <button onClick={handleImportClick} disabled={!file || !summary || summary.errors.length > 0} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg disabled:bg-gray-400">{t('import')}</button>
                </div>
            </div>
        </div>
        <ConfirmationDialog 
            isOpen={isConfirmOpen}
            title={t('importConfirmTitle')}
            message={t('importConfirmMessage', { new: (summary?.new || 0).toString(), update: (summary?.update || 0).toString() })}
            onConfirm={() => { setIsConfirmOpen(false); confirmImport(); }}
            onCancel={() => setIsConfirmOpen(false)}
            confirmText={t('import')}
        />
        </>
    );
};

// --- Main Component ---
export const UserManagement: React.FC<{ currentUser: UserCredentials, permissions: RolePermissions }> = ({ currentUser, permissions }) => {
    const { t } = useTranslation();
    const [users, setUsers] = useState<UserCredentials[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState<UserRole | ''>('');
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'username', direction: 'asc' });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [userToEdit, setUserToEdit] = useState<UserCredentials | null>(null);
    const [userToDelete, setUserToDelete] = useState<UserCredentials | null>(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    
    const fetchUsers = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await api.getUsers({
                page,
                limit: 10,
                search: searchQuery,
                role: roleFilter || undefined
            });
            setUsers(result.users);
            setTotalPages(result.totalPages);
        } catch (err: any) {
            setError(err.message || t('usersError'));
        } finally {
            setIsLoading(false);
        }
    }, [page, searchQuery, roleFilter, t]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);
    
    const sortedUsers = React.useMemo(() => {
        let sortableUsers = [...users];
        if (sortConfig.direction) {
            sortableUsers.sort((a, b) => {
                if (a[sortConfig.key]! < b[sortConfig.key]!) return sortConfig.direction === 'asc' ? -1 : 1;
                if (a[sortConfig.key]! > b[sortConfig.key]!) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return sortableUsers;
    }, [users, sortConfig]);

    const requestSort = (key: keyof UserCredentials) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const handleAddUser = () => {
        setUserToEdit(null);
        setIsModalOpen(true);
    };

    const handleEditUser = (user: UserCredentials) => {
        setUserToEdit(user);
        setIsModalOpen(true);
    };
    
    const handleDeleteUser = (user: UserCredentials) => {
        setUserToDelete(user);
        setIsConfirmOpen(true);
    };

    const confirmDelete = async () => {
        if (userToDelete) {
            await api.deleteUser(userToDelete.username);
            fetchUsers();
        }
        setIsConfirmOpen(false);
        setUserToDelete(null);
    };

    const handleSaveUser = async (userData: UserCredentials) => {
        if (userToEdit) {
            return api.updateUser(userData.username, userData);
        } else {
            return api.addUser(userData);
        }
    };
    
    const handleModalClose = () => {
        setIsModalOpen(false);
        fetchUsers();
    };
    
    const handleImportComplete = () => {
        fetchUsers(); // Refresh the user list after import
    };

    const handleRoleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setRoleFilter(e.target.value as UserRole | '');
        setPage(1); // Reset page to 1 when filter changes
    };

    const canManageUser = (targetUser: UserCredentials) => {
        if (currentUser.username === targetUser.username) return false; // Cannot manage self
        if (targetUser.role === 'admin') return false; // Cannot manage any admin

        const currentUserRoleIndex = USER_ROLES.indexOf(currentUser.role);
        const targetUserRoleIndex = USER_ROLES.indexOf(targetUser.role);
        
        return currentUserRoleIndex < targetUserRoleIndex;
    }

    return (
        <>
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                    <h2 className="text-xl font-bold text-gray-800">{t('userManagement')}</h2>
                    <div className="flex gap-2">
                        {permissions.canImportUsers && (
                            <button onClick={() => setIsImportModalOpen(true)} className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg shadow-sm">
                                <Upload className="w-4 h-4" /> <span>{t('importUsers')}</span>
                            </button>
                        )}
                        <button onClick={handleAddUser} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-sm">
                            <Plus className="w-4 h-4" /> <span>{t('addUser')}</span>
                        </button>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                    <input
                        type="text"
                        placeholder={t('userSearchPlaceholder')}
                        value={searchQuery}
                        onChange={(e) => {setSearchQuery(e.target.value); setPage(1);}}
                        className="w-full sm:flex-grow max-w-sm bg-gray-50 border border-gray-300 rounded-md p-2 ps-4 text-sm text-black"
                    />
                     <select
                        value={roleFilter}
                        onChange={handleRoleFilterChange}
                        className="w-full sm:w-auto bg-gray-50 border border-gray-300 rounded-md p-2 text-sm text-black"
                    >
                        <option value="">{t('allRoles')}</option>
                        {USER_ROLES.map(role => (
                            <option key={role} value={role}>{t(`roles.${role}`)}</option>
                        ))}
                    </select>
                </div>


                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                {(['username', 'firstName', 'lastName', 'email', 'role'] as (keyof UserCredentials)[]).map(key => (
                                    <th key={key} scope="col" className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        <button onClick={() => requestSort(key)} className="flex items-center gap-2">
                                            {t(key)} <SortIcon direction={sortConfig.key === key ? sortConfig.direction : null} />
                                        </button>
                                    </th>
                                ))}
                                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {isLoading ? (
                                <tr><td colSpan={6} className="text-center p-4">{t('usersLoading')}</td></tr>
                            ) : error ? (
                                <tr><td colSpan={6} className="text-center p-4 text-red-600">{error}</td></tr>
                            ) : sortedUsers.length === 0 ? (
                                <tr><td colSpan={6} className="text-center p-4 text-gray-500">{t('usersNotFound')}</td></tr>
                            ) : (
                                sortedUsers.map(user => (
                                    <tr key={user.username} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.username}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.firstName}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.lastName}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{t(`roles.${user.role}`)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-end text-sm font-medium">
                                            {canManageUser(user) ? (
                                                <div className="flex justify-end gap-4">
                                                    <button onClick={() => handleEditUser(user)} className="text-blue-600 hover:text-blue-900"><Edit className="w-5 h-5"/></button>
                                                    <button onClick={() => handleDeleteUser(user)} className="text-red-600 hover:text-red-900"><Trash2 className="w-5 h-5"/></button>
                                                </div>
                                            ) : null}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="flex justify-between items-center mt-6">
                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="px-4 py-2 text-sm bg-gray-200 rounded-md disabled:opacity-50">{t('previous')}</button>
                        <span className="text-sm text-gray-600">{t('pageIndicator', { page: page.toString(), totalPages: totalPages.toString() })}</span>
                        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-4 py-2 text-sm bg-gray-200 rounded-md disabled:opacity-50">{t('next')}</button>
                    </div>
                )}
            </div>

            <UserFormModal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                onSave={handleSaveUser}
                userToEdit={userToEdit}
                currentUser={currentUser}
            />
            <ImportUsersModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onImport={handleImportComplete}
            />
            <ConfirmationDialog
                isOpen={isConfirmOpen}
                title={t('deleteUserConfirmTitle')}
                message={t('deleteUserConfirmMessage', { user: `${userToDelete?.firstName} ${userToDelete?.lastName}` })}
                onConfirm={confirmDelete}
                onCancel={() => setIsConfirmOpen(false)}
                confirmText={t('delete')}
            />
        </>
    );
};
