import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { User, UserRole, UserCredentials } from '../types.ts';
import * as api from '../services/apiService.ts';
import { USER_ROLES } from '../constants.ts';
import { FilePenLine, Plus, Trash2, KeyRound, ShieldCheck } from 'lucide-react';
import { ConfirmationDialog } from './Header.tsx';
import { useTranslation } from '../i18n/i18n.tsx';
import { SortIcon } from './icons/SortIcon.tsx';

const canModifyUser = (currentUserRole: UserRole, targetUserRole: UserRole): boolean => {
    switch (currentUserRole) {
        case 'admin':
            return targetUserRole !== 'admin';
        case 'manager':
            return ['supervisor', 'support', 'client'].includes(targetUserRole);
        case 'supervisor':
            return ['support', 'client'].includes(targetUserRole);
        case 'support':
            return ['client'].includes(targetUserRole);
        default:
            return false;
    }
};

const getAllowedRolesToCreate = (currentUserRole: UserRole): UserRole[] => {
     switch (currentUserRole) {
        case 'admin':
            return ['manager', 'supervisor', 'support', 'client'];
        case 'manager':
            return ['supervisor', 'support', 'client'];
        case 'supervisor':
            return ['support', 'client'];
        case 'support':
            return ['client'];
        default:
            return [];
    }
};

const RoleBadge: React.FC<{ role: UserRole }> = ({ role }) => {
    const { t } = useTranslation();
    const roleColors = {
        admin: 'bg-red-100 text-red-800 border-red-200',
        manager: 'bg-purple-100 text-purple-800 border-purple-200',
        supervisor: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        support: 'bg-blue-100 text-blue-800 border-blue-200',
        client: 'bg-green-100 text-green-800 border-green-200',
    };
    const roleTranslations: Record<UserRole, string> = {
        admin: t('roles.admin'),
        manager: t('roles.manager'),
        supervisor: t('roles.supervisor'),
        support: t('roles.support'),
        client: t('roles.client'),
    };
    return (
        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${roleColors[role]}`}>
            {roleTranslations[role]}
        </span>
    );
};

const UserFormModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (user: UserCredentials) => Promise<{success: boolean, message?: string}>;
    userToEdit: UserCredentials | null;
    currentUserRole: UserRole;
}> = ({ isOpen, onClose, onSave, userToEdit, currentUserRole }) => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
        password: '', role: 'client' as UserRole, firstName: '', lastName: '', email: '', mobile: '',
    });
    const [username, setUsername] = useState('');
    const [error, setError] = useState<string | null>(null);
    const allowedRoles = getAllowedRolesToCreate(currentUserRole);

    useEffect(() => {
        if (isOpen) {
            if (userToEdit) {
                setUsername(userToEdit.username);
                setFormData({
                    password: '',
                    role: userToEdit.role,
                    firstName: userToEdit.firstName,
                    lastName: userToEdit.lastName,
                    email: userToEdit.email,
                    mobile: userToEdit.mobile,
                });
            } else {
                setUsername('');
                setFormData({
                    password: '',
                    role: allowedRoles[0] || 'client',
                    firstName: '', lastName: '', email: '', mobile: '',
                });
            }
            setError(null);
        }
    }, [userToEdit, isOpen, currentUserRole, allowedRoles]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        setError(null);
        if (!username.trim() || !formData.email.trim() || !formData.firstName.trim() || !formData.lastName.trim()) {
            setError(t('formRequiredError'));
            return;
        }
        if (!userToEdit && !formData.password) {
            setError(t('passwordRequiredForNew'));
            return;
        }

        const userPayload: UserCredentials = {
            username,
            ...formData,
            emailVerified: userToEdit?.emailVerified || false,
            // These are system-assigned, so we send dummy data
            ip: userToEdit?.ip || 'N/A',
            device: userToEdit?.device || 'N/A',
            os: userToEdit?.os || 'N/A',
        };

        const result = await onSave(userPayload);
        if (!result.success) {
            setError(result.message || t('userSaveFailed'));
        }
    };
    
    const isEditing = !!userToEdit;

    const roleTranslations: Record<UserRole, string> = {
        admin: t('roles.admin'),
        manager: t('roles.manager'),
        supervisor: t('roles.supervisor'),
        support: t('roles.support'),
        client: t('roles.client'),
    };

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg m-4 text-start">
                <h2 className="text-xl font-bold text-gray-800 mb-4">{isEditing ? t('editUser') : t('addNewUser')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium text-gray-700">{t('usernameLabel')}</label>
                        <input name="username" value={username} onChange={(e) => setUsername(e.target.value)} disabled={isEditing} className="mt-1 w-full bg-gray-50 border border-gray-300 rounded-md p-2 disabled:bg-gray-200" />
                    </div>
                     <div>
                        <label className="text-sm font-medium text-gray-700">{t('role')}</label>
                        <select name="role" value={formData.role} onChange={handleChange} className="mt-1 w-full bg-gray-50 border border-gray-300 rounded-md p-2">
                            {allowedRoles.map(role => <option key={role} value={role}>{roleTranslations[role]}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700">{t('firstName')}</label>
                        <input name="firstName" value={formData.firstName} onChange={handleChange} className="mt-1 w-full bg-gray-50 border border-gray-300 rounded-md p-2" />
                    </div>
                     <div>
                        <label className="text-sm font-medium text-gray-700">{t('lastName')}</label>
                        <input name="lastName" value={formData.lastName} onChange={handleChange} className="mt-1 w-full bg-gray-50 border border-gray-300 rounded-md p-2" />
                    </div>
                     <div>
                        <label className="text-sm font-medium text-gray-700">{t('email')}</label>
                        <input type="email" name="email" value={formData.email} onChange={handleChange} className="mt-1 w-full bg-gray-50 border border-gray-300 rounded-md p-2" />
                    </div>
                     <div>
                        <label className="text-sm font-medium text-gray-700">{t('mobile')}</label>
                        <input name="mobile" value={formData.mobile} onChange={handleChange} className="mt-1 w-full bg-gray-50 border border-gray-300 rounded-md p-2" />
                    </div>
                     <div className="md:col-span-2">
                        <label className="text-sm font-medium text-gray-700">{t('passwordLabel')} {isEditing && <span className="text-xs text-gray-500">{t('passwordUnchanged')}</span>}</label>
                        <input type="password" name="password" value={formData.password} onChange={handleChange} className="mt-1 w-full bg-gray-50 border border-gray-300 rounded-md p-2" />
                    </div>
                    {error && <p className="md:col-span-2 text-sm text-red-600 p-2 bg-red-50 rounded-md">{error}</p>}
                </div>
                <div className="flex justify-end gap-3 mt-6">
                    <button onClick={onClose} className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-4 border border-gray-300 rounded-lg">{t('cancel')}</button>
                    <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg">{t('save')}</button>
                </div>
            </div>
        </div>
    );
};

const ResetPasswordModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    user: UserCredentials | null;
}> = ({ isOpen, onClose, user }) => {
    const { t } = useTranslation();
    const [newPassword, setNewPassword] = useState('');
    const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

    useEffect(() => {
        if(isOpen) {
            setNewPassword('');
            setMessage(null);
        }
    }, [isOpen]);

    if (!isOpen || !user) return null;

    const handleReset = async () => {
        setMessage(null);
        if (newPassword.length < 6) {
            setMessage({ type: 'error', text: t('passwordLengthError')});
            return;
        }
        const result = await api.resetUserPassword(user.username, newPassword);
        if (result.success) {
            setMessage({ type: 'success', text: result.message });
            setTimeout(onClose, 2000);
        } else {
            setMessage({ type: 'error', text: result.message });
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm m-4 text-start">
                <h2 className="text-xl font-bold text-gray-800 mb-2">{t('resetUserPasswordTitle')}</h2>
                <p className="text-sm text-gray-600 mb-4">{t('resettingFor', { username: user.username })}</p>
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-gray-700">{t('newPassword')}</label>
                        <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="mt-1 w-full bg-gray-50 border border-gray-300 rounded-md p-2"/>
                    </div>
                    {message && <p className={`text-sm p-2 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{message.text}</p>}
                </div>
                <div className="flex justify-end gap-3 mt-6">
                    <button onClick={onClose} className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-4 border border-gray-300 rounded-lg">{t('cancel')}</button>
                    <button onClick={handleReset} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg">{t('resetPasswordButton')}</button>
                </div>
            </div>
        </div>
    );
};

const TableHeader: React.FC<{
    label: string;
    sortKey: keyof UserCredentials;
    currentSort: keyof UserCredentials | null;
    direction: 'asc' | 'desc';
    onSort: (key: keyof UserCredentials) => void;
}> = ({ label, sortKey, currentSort, direction, onSort }) => {
    return (
        <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
            <button onClick={() => onSort(sortKey)} className="flex items-center gap-2">
                {label}
                <SortIcon
                    direction={currentSort === sortKey ? direction : null}
                />
            </button>
        </th>
    );
};


export const UserManagement: React.FC<{ currentUser: User }> = ({ currentUser }) => {
  const { t } = useTranslation();
  const [users, setUsers] = useState<UserCredentials[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<UserRole | 'all'>('all');
  
  const [sortColumn, setSortColumn] = useState<keyof UserCredentials | null>('username');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<UserCredentials | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserCredentials | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isResetPassModalOpen, setIsResetPassModalOpen] = useState(false);
  const [userToResetPass, setUserToResetPass] = useState<UserCredentials | null>(null);
  const [actionStatus, setActionStatus] = useState<string | null>(null);
  
  const canCreateUsers = getAllowedRolesToCreate(currentUser.role).length > 0;

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await api.getUsers({ page, limit: 10, search: searchQuery, role: activeTab === 'all' ? undefined : activeTab });
      setUsers(result.users);
      setTotalPages(result.totalPages);
    } catch (err: any) {
      setError((err as Error).message || t('usersError'));
    } finally {
      setIsLoading(false);
    }
  }, [page, searchQuery, activeTab, t]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);
  
  const handleTabChange = (tab: UserRole | 'all') => {
    setActiveTab(tab);
    setPage(1);
  };
  
  const handleSort = (key: keyof UserCredentials) => {
      if (sortColumn === key) {
          setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
      } else {
          setSortColumn(key);
          setSortDirection('asc');
      }
  };

  const sortedUsers = useMemo(() => {
      if (!sortColumn) return users;
      return [...users].sort((a, b) => {
          const aVal = a[sortColumn];
          const bVal = b[sortColumn];

          if (aVal === undefined || aVal === null) return 1;
          if (bVal === undefined || bVal === null) return -1;
          
          const comparison = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
          
          return sortDirection === 'asc' ? comparison : -comparison;
      });
  }, [users, sortColumn, sortDirection]);

  const handleSaveUser = async (user: UserCredentials) => {
    let result: { success: boolean, message?: string };
    if (userToEdit) {
      result = await api.updateUser(user.username, user);
    } else {
      result = await api.addUser(user);
    }
    
    if (result.success) {
        setIsModalOpen(false);
        setUserToEdit(null);
        fetchUsers();
    }
    return result;
  };

  const handleResendVerification = async (username: string) => {
      const result = await api.resendVerificationEmail(username);
      setActionStatus(result.message);
      setTimeout(() => setActionStatus(null), 3000);
  };
  
  const handleOpenResetPassword = (user: UserCredentials) => {
      setUserToResetPass(user);
      setIsResetPassModalOpen(true);
  };

  const handleAddUser = () => { if (canCreateUsers) { setUserToEdit(null); setIsModalOpen(true); }};
  const handleEditUser = (user: UserCredentials) => { setUserToEdit(user); setIsModalOpen(true); };
  const handleDeleteUser = (user: UserCredentials) => { setUserToDelete(user); setIsConfirmOpen(true); };
  const confirmDelete = async () => {
    if (userToDelete) {
        await api.deleteUser(userToDelete.username);
        fetchUsers();
    }
    setIsConfirmOpen(false);
    setUserToDelete(null);
  };

  const TABS: { label: string; role: UserRole | 'all' }[] = [
    { label: t('allManageable'), role: 'all' },
    { label: t('supervisors'), role: 'supervisor' },
    { label: t('supportStaff'), role: 'support' },
    { label: t('clients'), role: 'client' },
];

  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
          <input type="text" placeholder={t('usersSearchPlaceholder')} value={searchQuery} onChange={(e) => {setSearchQuery(e.target.value); setPage(1);}} className="w-full sm:flex-grow max-w-sm bg-gray-50 border border-gray-300 rounded-md p-2 ps-4 text-sm"/>
          {canCreateUsers && (
            <button onClick={handleAddUser} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-sm">
                <Plus className="w-4 h-4" />
                <span>{t('addUser')}</span>
            </button>
          )}
        </div>
        
        <div className="border-b border-gray-200 mb-4">
            <nav className="-mb-px flex space-x-6 rtl:space-x-reverse overflow-x-auto">
                {TABS.filter(tab => currentUser.role === 'admin' || currentUser.role === 'manager' || tab.role !== 'supervisor').map(tab => (
                    <button key={tab.role} onClick={() => handleTabChange(tab.role)} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${activeTab === tab.role ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                        {tab.label}
                    </button>
                ))}
            </nav>
        </div>
        
        {actionStatus && <p className="text-sm text-green-700 bg-green-50 p-3 rounded-md mb-4">{actionStatus}</p>}

        <div className="overflow-x-auto">
            {isLoading ? <div className="text-center p-4">{t('usersLoading')}</div> :
             error ? <div className="text-center p-4 text-red-600">{error}</div> :
             users.length === 0 ? <div className="text-center p-4 text-gray-500">{t('usersNotFound')}</div> : (
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <TableHeader label={t('usernameLabel')} sortKey="username" currentSort={sortColumn} direction={sortDirection} onSort={handleSort} />
                            <TableHeader label={t('fullName')} sortKey="firstName" currentSort={sortColumn} direction={sortDirection} onSort={handleSort} />
                            <TableHeader label={t('email')} sortKey="email" currentSort={sortColumn} direction={sortDirection} onSort={handleSort} />
                            <TableHeader label={t('role')} sortKey="role" currentSort={sortColumn} direction={sortDirection} onSort={handleSort} />
                            <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">{t('status')}</th>
                            <th className="px-4 py-3 text-end text-xs font-medium text-gray-500 uppercase tracking-wider">{t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {sortedUsers.map((user) => {
                            const canModify = canModifyUser(currentUser.role, user.role);
                            return (
                                <tr key={user.username} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{user.username}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{user.firstName} {user.lastName}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{user.email}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm"><RoleBadge role={user.role} /></td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                        <div className="flex items-center gap-2" title={user.emailVerified ? t('emailVerified') : t('emailNotVerified')}>
                                            <ShieldCheck className={`w-5 h-5 ${user.emailVerified ? 'text-green-600' : 'text-gray-400'}`} />
                                            {!user.emailVerified && canModify && (
                                                <button onClick={() => handleResendVerification(user.username)} className="text-xs text-blue-600 hover:underline">{t('resend')}</button>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-end">
                                        <div className="flex items-center justify-end gap-3 text-gray-500">
                                            <button onClick={() => handleOpenResetPassword(user)} disabled={!canModify} className="disabled:opacity-30 disabled:cursor-not-allowed hover:text-gray-700 p-1" title={t('resetPasswordButton')}><KeyRound className="w-5 h-5" /></button>
                                            <button onClick={() => handleEditUser(user)} disabled={!canModify} className="disabled:opacity-30 disabled:cursor-not-allowed hover:text-blue-600 p-1" title={t('editUser')}><FilePenLine className="w-5 h-5" /></button>
                                            <button onClick={() => handleDeleteUser(user)} disabled={user.username === currentUser.username || !canModify} className="disabled:opacity-30 disabled:cursor-not-allowed hover:text-red-600 p-1" title={t('delete')}><Trash2 className="w-5 h-5" /></button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            )}
        </div>

        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="w-full sm:w-auto px-4 py-2 text-sm bg-gray-200 rounded-md disabled:opacity-50">{t('previous')}</button>
              <span className="text-sm text-gray-600">{t('pageIndicator', { page: page.toString(), totalPages: totalPages.toString() })}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="w-full sm:w-auto px-4 py-2 text-sm bg-gray-200 rounded-md disabled:opacity-50">{t('next')}</button>
          </div>
        )}
      </div>
      
      <UserFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveUser} userToEdit={userToEdit} currentUserRole={currentUser.role}/>
      <ConfirmationDialog isOpen={isConfirmOpen} title={t('deleteUserConfirmTitle')} message={t('deleteUserConfirmMessage', { username: userToDelete?.username || ''})} onConfirm={confirmDelete} onCancel={() => setIsConfirmOpen(false)} confirmText={t('delete')} />
      <ResetPasswordModal isOpen={isResetPassModalOpen} onClose={() => setIsResetPassModalOpen(false)} user={userToResetPass} />
    </>
  );
};