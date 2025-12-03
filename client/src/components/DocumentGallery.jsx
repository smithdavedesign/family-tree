import React, { useState, useEffect } from 'react';
import { Plus, Trash2, FileText, Download, ExternalLink, File, FileImage } from 'lucide-react';
import { Button, useToast } from './ui';
import { supabase } from '../auth';
import DocumentPicker from './DocumentPicker';

const DocumentGallery = ({ personId, canEdit }) => {
    const { toast } = useToast();
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isPickerOpen, setIsPickerOpen] = useState(false);

    useEffect(() => {
        if (personId) {
            fetchDocuments();
        }
    }, [personId]);

    const fetchDocuments = async () => {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            const response = await fetch(`/api/person/${personId}/documents`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setDocuments(data);
            }
        } catch (error) {
            console.error("Error fetching documents:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddDocument = async (docData) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            const response = await fetch('/api/documents', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    person_id: personId,
                    ...docData
                })
            });

            if (response.ok) {
                fetchDocuments();
                toast.success("Document added");
            } else {
                toast.error("Failed to add document");
            }
        } catch (error) {
            console.error("Error adding document:", error);
            toast.error("Error adding document");
        }
    };

    const handleDelete = async (docId) => {
        if (!confirm('Are you sure you want to delete this document?')) return;

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            const response = await fetch(`/api/documents/${docId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
                setDocuments(documents.filter(d => d.id !== docId));
                toast.success("Document deleted");
            } else {
                toast.error("Failed to delete document");
            }
        } catch (error) {
            console.error("Error deleting document:", error);
            toast.error("Error deleting document");
        }
    };

    const getFileIcon = (type) => {
        if (type?.includes('image')) return <FileImage className="w-5 h-5 text-purple-500" />;
        if (type?.includes('pdf')) return <FileText className="w-5 h-5 text-red-500" />;
        return <File className="w-5 h-5 text-blue-500" />;
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Documents</h4>
                {canEdit && (
                    <Button
                        variant="ghost"
                        size="sm"
                        leftIcon={<Plus className="w-4 h-4" />}
                        onClick={() => setIsPickerOpen(true)}
                    >
                        Add Document
                    </Button>
                )}
            </div>

            {loading ? (
                <div className="text-center py-4 text-slate-500 text-sm">Loading documents...</div>
            ) : documents.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                    <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">No documents yet</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {documents.map(doc => (
                        <div key={doc.id} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg hover:shadow-sm transition-shadow group">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="p-2 bg-slate-50 rounded-lg flex-shrink-0">
                                    {getFileIcon(doc.type)}
                                </div>
                                <div className="min-w-0">
                                    <h5 className="text-sm font-medium text-slate-900 truncate" title={doc.title}>
                                        {doc.title}
                                    </h5>
                                    <p className="text-xs text-slate-500 truncate">
                                        {new Date(doc.created_at).toLocaleDateString()} • {doc.source === 'google_drive' ? 'Google Drive' : 'Uploaded'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-1">
                                <a
                                    href={doc.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                    title="Open document"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                </a>

                                {canEdit && (
                                    <button
                                        onClick={() => handleDelete(doc.id)}
                                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                                        title="Delete document"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <DocumentPicker
                isOpen={isPickerOpen}
                onClose={() => setIsPickerOpen(false)}
                onSelect={handleAddDocument}
            />
        </div>
    );
};

export default DocumentGallery;
