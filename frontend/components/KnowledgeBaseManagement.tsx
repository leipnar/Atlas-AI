

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { KnowledgeEntry } from '../types.ts';
import * as api from '../services/apiService.ts';
import { Plus, FilePenLine, Trash2, Check, LoaderCircle, Upload } from 'lucide-react';
import { ConfirmationDialog } from './Header.tsx';
import { useTranslation } from '../i18n/i18n.tsx';

// --- Helper Icons for Save Status ---
const SpinnerIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <LoaderCircle {...props} />
);

// Helper component for highlighting search results
const HighlightMatches: React.FC<{ text: string; query: string }> = React.memo(({ text, query }) => {
    const sanitizedQuery = query.trim();
    if (!sanitizedQuery) {
        return <>{text}</>;
    }

    // Create a regex to find all occurrences of any of the search words
    const searchWords = sanitizedQuery
        .split(/\s+/)
        .filter(word => word.length > 0)
        .map(word => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')); // Escape special chars

    if (searchWords.length === 0) {
        return <>{text}</>;
    }

    const regex = new RegExp(`(${searchWords.join('|')})`, 'gi');
    const parts = text.split(regex);

    return (
        <>
            {parts.map((part, i) => {
                // Check if the part is one of the search words (case-insensitive)
                const isMatch = searchWords.some(word => part.toLowerCase() === word.toLowerCase());
                if (isMatch) {
                    return (
                        <mark key={i} className="bg-yellow-200 text-black px-0.5 rounded-sm">
                            {part}
                        </mark>
                    );
                }
                return part;
            })}
        </>
    );
});


// --- New Confirmation Dialog for Unsaved Changes ---
const UnsavedChangesDialog: React.FC<{
    onSave: () => void;
    onDiscard: () => void;
    onCancel: () => void;
}> = ({ onSave, onDiscard, onCancel }) => {
    const { t } = useTranslation();
    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-60 flex items-center justify-center z-[60]">
        <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm m-4">
            <h2 className="text-xl font-bold text-gray-800 mb-4">{t('unsavedChangesTitle')}</h2>
            <p className="text-gray-600 mb-6">{t('unsavedChangesMessage')}</p>
            <div className="flex justify-end gap-3">
                <button onClick={onCancel} className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-4 border border-gray-300 rounded-lg">{t('keepEditing')}</button>
                <button onClick={onDiscard} className="bg-red-100 hover:bg-red-200 text-red-700 font-semibold py-2 px-4 border border-red-200 rounded-lg">{t('discardChanges')}</button>
                <button onClick={onSave} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-sm">{t('saveAndClose')}</button>
            </div>
        </div>
        </div>
    );
};


interface EntryFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: { tag: string; content: string }) => Promise<KnowledgeEntry>;
    entryToEdit: KnowledgeEntry | null;
}

const EntryFormModal: React.FC<EntryFormModalProps> = ({ isOpen, onClose, onSave, entryToEdit }) => {
    const { t } = useTranslation();
    const [tag, setTag] = useState('');
    const [content, setContent] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [saveStatus, setSaveStatus] = useState<'saved' | 'unsaved' | 'saving'>('saved');
    const [isConfirmCloseOpen, setIsConfirmCloseOpen] = useState(false);

    const autoSaveTimer = useRef<number | null>(null);
    const initialData = useRef<{ tag: string; content: string } | null>(null);

    useEffect(() => {
        if (isOpen) {
            const data = { tag: entryToEdit?.tag || '', content: entryToEdit?.content || '' };
            setTag(data.tag);
            setContent(data.content);
            initialData.current = data;
            setSaveStatus('saved');
            setError(null);
        }
    }, [entryToEdit, isOpen]);

    const handleAutoSave = useCallback(async () => {
        if (saveStatus !== 'unsaved' || !tag.trim() || !content.trim()) return;

        setError(null);
        setSaveStatus('saving');
        try {
            const savedEntry = await onSave({ tag, content });
            initialData.current = { tag: savedEntry.tag, content: savedEntry.content };
            setSaveStatus('saved');
        } catch (e) {
            setError(t('kbAutoSaveError'));
            setSaveStatus('unsaved');
        }
    }, [tag, content, saveStatus, onSave, t]);
    
    useEffect(() => {
        if (!isOpen) return;
        if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);

        const hasChanges = tag !== initialData.current?.tag || content !== initialData.current?.content;

        if (hasChanges) {
            setSaveStatus('unsaved');
            autoSaveTimer.current = window.setTimeout(() => {
                handleAutoSave();
            }, 5000); // 5 seconds
        }

        return () => {
            if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
        };
    }, [tag, content, isOpen, handleAutoSave]);


    const handleCloseAttempt = () => {
        if (saveStatus === 'unsaved') {
            setIsConfirmCloseOpen(true);
        } else {
            onClose();
        }
    };

    const handleSaveAndClose = async () => {
        if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
        setError(null);

        if (!tag.trim() || !content.trim()) {
            setError(t('formRequiredError')); // A more generic error
            return;
        }
        
        setSaveStatus('saving');
        try {
            await onSave({ tag, content });
            onClose();
        } catch (e) {
            setError(t('kbSaveError'));
            setSaveStatus('unsaved');
        }
    };

    if (!isOpen) return null;
    
    const SaveStatusIndicator: React.FC = () => {
        switch (saveStatus) {
            case 'saving':
                return <div className="flex items-center gap-2 text-sm text-blue-600"><SpinnerIcon className="w-4 h-4 animate-spin" />{t('kbSaving')}</div>;
            case 'unsaved':
                 return <div className="flex items-center gap-2 text-sm text-gray-600">{t('kbUnsavedChanges')}</div>;
            case 'saved':
                return <div className="flex items-center gap-2 text-sm text-green-600"><Check className="w-4 h-4" />{t('kbSaved')}</div>;
            default:
                return null;
        }
    };

    return (
        <>
            <div className="fixed inset-0 bg-gray-900 bg-opacity-60 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl m-4">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">{entryToEdit && entryToEdit.id ? t('editEntry') : t('addEntry')}</h2>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="tag" className="block text-sm font-medium text-gray-700">{t('kbTagLabel')}</label>
                            <input id="tag" name="tag" value={tag} onChange={(e) => setTag(e.target.value)} className="mt-1 w-full bg-gray-50 border border-gray-300 rounded-md p-2 text-black" placeholder={t('kbTagPlaceholder')}/>
                        </div>
                        <div>
                            <label htmlFor="content" className="block text-sm font-medium text-gray-700">{t('kbContentLabel')}</label>
                            <textarea id="content" name="content" value={content} onChange={(e) => setContent(e.target.value)} rows={8} className="mt-1 w-full bg-gray-50 border border-gray-300 rounded-md p-2 resize-y text-black" placeholder={t('kbContentPlaceholder')}/>
                        </div>
                        {error && <p className="text-sm text-red-600 p-2 bg-red-50 rounded-md">{error}</p>}
                    </div>
                    <div className="flex justify-between items-center mt-6">
                        <SaveStatusIndicator />
                        <div className="flex gap-3">
                            <button onClick={handleCloseAttempt} className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-4 border border-gray-300 rounded-lg">{t('cancel')}</button>
                            <button onClick={handleSaveAndClose} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg">{t('saveAndClose')}</button>
                        </div>
                    </div>
                </div>
            </div>
            {isConfirmCloseOpen && (
                <UnsavedChangesDialog
                    onSave={async () => {
                        setIsConfirmCloseOpen(false);
                        await handleSaveAndClose();
                    }}
                    onDiscard={() => {
                        setIsConfirmCloseOpen(false);
                        onClose();
                    }}
                    onCancel={() => setIsConfirmCloseOpen(false)}
                />
            )}
        </>
    );
};


export const KnowledgeBaseManagement: React.FC<{ isReadOnly: boolean }> = ({ isReadOnly }) => {
  const { t } = useTranslation();
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [entryToEdit, setEntryToEdit] = useState<KnowledgeEntry | null>(null);
  const [entryToDelete, setEntryToDelete] = useState<KnowledgeEntry | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchEntries = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getKnowledgeBase();
      setEntries(data);
    } catch (err: any) {
      setError(err.message || t('kbError'));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const handleAddEntry = () => {
    if (isReadOnly) return;
    setEntryToEdit(null);
    setIsModalOpen(true);
  };

  const handleEditEntry = (entry: KnowledgeEntry) => {
    if (isReadOnly) return;
    setEntryToEdit(entry);
    setIsModalOpen(true);
  };
  
  const handleModalClose = () => {
    setIsModalOpen(false);
    setEntryToEdit(null);
  };

  const handleDeleteEntry = (entry: KnowledgeEntry) => {
    if (isReadOnly) return;
    setEntryToDelete(entry);
    setIsConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (entryToDelete) {
      await api.deleteKnowledgeEntry(entryToDelete.id);
      fetchEntries();
    }
    setIsConfirmOpen(false);
    setEntryToDelete(null);
  };

  const handleSaveEntry = async (formData: { tag: string; content: string }): Promise<KnowledgeEntry> => {
    const currentUser = await api.getCurrentUser();
    const updatedBy = currentUser?.username || 'system';
    
    let savedEntry: KnowledgeEntry;

    if (entryToEdit && entryToEdit.id) {
      const updatedEntry: KnowledgeEntry = { ...entryToEdit, ...formData, lastUpdated: Date.now(), updatedBy };
      savedEntry = await api.updateKnowledgeEntry(updatedEntry);
    } else {
      const newEntry: Omit<KnowledgeEntry, 'id'> = { ...formData, lastUpdated: Date.now(), updatedBy };
      savedEntry = await api.addKnowledgeEntry(newEntry);
      // After creating, update parent state so subsequent saves are updates
      setEntryToEdit(savedEntry);
    }
    
    fetchEntries(); // Refresh list in the background
    return savedEntry;
  };
  
  const handleFileUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!['text/plain', 'text/markdown'].includes(file.type) && !file.name.endsWith('.txt') && !file.name.endsWith('.md')) {
        setError(t('kbUploadErrorInvalid'));
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const content = e.target?.result as string;
        const tag = file.name.replace(/\.(txt|md)$/, "");

        const tempEntry: KnowledgeEntry = {
            id: '', // Empty id signifies a new entry from a file
            tag: tag,
            content: content,
            lastUpdated: Date.now(),
            updatedBy: ''
        };
        setEntryToEdit(tempEntry);
        setIsModalOpen(true);
    };
    reader.onerror = () => {
        setError(t('kbUploadErrorRead'));
    };
    reader.readAsText(file);

    // Reset input value to allow uploading the same file again
    event.target.value = '';
  };


  const filteredEntries = useMemo(() => {
    const sanitizedQuery = searchQuery.toLowerCase().trim();
    if (!sanitizedQuery) {
        return entries;
    }

    const searchTokens = sanitizedQuery.split(/\s+/).filter(Boolean);

    return entries.filter(entry => {
        const entryText = `${entry.tag.toLowerCase()} ${entry.content.toLowerCase()}`;
        return searchTokens.every(token => entryText.includes(token));
    });
  }, [entries, searchQuery]);


  const formatDate = (timestamp: number) => new Date(timestamp).toLocaleString();

  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
          <input
            type="text"
            placeholder={t('kbSearchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:flex-grow max-w-sm bg-gray-50 border border-gray-300 rounded-md p-2 ps-4 text-sm text-black"
          />
          {!isReadOnly && (
            <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-2">
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".txt,.md,text/plain,text/markdown"
                />
                 <button
                    onClick={handleFileUploadClick}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg shadow-sm"
                >
                    <Upload className="w-4 h-4" />
                    <span>{t('uploadFile')}</span>
                </button>
                <button
                    onClick={handleAddEntry}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-sm"
                    >
                    <Plus className="w-4 h-4" />
                    <span>{t('addEntry')}</span>
                </button>
            </div>
          )}
        </div>
        
        {error && <p className="text-sm text-red-600 p-3 bg-red-50 rounded-md mb-4">{error}</p>}

        {isLoading ? <div className="text-center p-4">{t('kbLoading')}</div> :
         error ? <div className="text-center p-4 text-red-600">{error}</div> :
         filteredEntries.length === 0 ? <div className="text-center p-4 text-gray-500">{t('kbNotFound')}</div> : (
            <div className="space-y-4">
              {filteredEntries.map((entry) => (
                <div key={entry.id} className="p-4 bg-gray-50 rounded-md border border-gray-200">
                  <div className="flex justify-between items-start">
                    <div className="flex-grow min-w-0">
                      <h4 className="font-semibold text-gray-800 break-words">
                        <HighlightMatches text={entry.tag} query={searchQuery} />
                      </h4>
                      <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap break-words">
                        <HighlightMatches text={entry.content} query={searchQuery} />
                      </p>
                    </div>
                    {!isReadOnly && (
                      <div className="flex items-center gap-2 text-gray-500 flex-shrink-0 ms-4">
                        <button onClick={() => handleEditEntry(entry)} className="hover:text-blue-600"><FilePenLine className="w-5 h-5" /></button>
                        <button onClick={() => handleDeleteEntry(entry)} className="hover:text-red-600"><Trash2 className="w-5 h-5" /></button>
                      </div>
                    )}
                  </div>
                  <div className="text-end text-xs text-gray-400 mt-2">
                    {t('lastUpdatedBy', { user: entry.updatedBy, date: formatDate(entry.lastUpdated) })}
                  </div>
                </div>
              ))}
            </div>
        )}
      </div>
      
      <EntryFormModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSave={handleSaveEntry}
        entryToEdit={entryToEdit}
      />
      
      <ConfirmationDialog
        isOpen={isConfirmOpen}
        title={t('deleteEntryConfirmTitle')}
        message={t('deleteEntryConfirmMessage', { tag: entryToDelete?.tag || '' })}
        onConfirm={confirmDelete}
        onCancel={() => setIsConfirmOpen(false)}
        confirmText={t('delete')}
      />
    </>
  );
};