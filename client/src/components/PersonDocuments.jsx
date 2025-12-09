import React from 'react';
import { FileText, Download, ExternalLink, File, FileImage, Folder } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../auth';

const fetchPersonDocuments = async (personId) => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    const response = await fetch(`/api/person/${personId}/documents`, {
        headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) throw new Error('Failed to fetch documents');
    return response.json();
};

const PersonDocuments = ({ personId }) => {
    const { data: documents = [], isLoading } = useQuery({
        queryKey: ['personDocuments', personId],
        queryFn: () => fetchPersonDocuments(personId),
    });

    const getFileIcon = (type) => {
        if (type?.includes('image')) return <FileImage className="w-6 h-6 text-purple-500" />;
        if (type?.includes('pdf')) return <FileText className="w-6 h-6 text-red-500" />;
        return <File className="w-6 h-6 text-blue-500" />;
    };

    if (isLoading) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                    <Folder className="w-6 h-6 text-teal-600" />
                    Documents
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2].map(i => (
                        <div key={i} className="h-24 bg-slate-100 rounded-lg animate-pulse"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                    <Folder className="w-6 h-6 text-teal-600" />
                    Documents
                    <span className="text-lg font-normal text-slate-500">({documents.length})</span>
                </h2>
            </div>

            {documents.length === 0 ? (
                <div className="text-center py-12">
                    <Folder className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 mb-2">No documents yet</p>
                    <p className="text-sm text-slate-400">Birth certificates, records, and other documents will appear here</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {documents.map(doc => (
                        <a
                            key={doc.id}
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex items-start gap-4 p-4 bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-xl hover:border-teal-300 hover:shadow-md transition-all"
                        >
                            <div className="p-3 bg-white rounded-lg shadow-sm flex-shrink-0">
                                {getFileIcon(doc.type)}
                            </div>

                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-slate-900 group-hover:text-teal-600 transition-colors mb-1 truncate">
                                    {doc.title}
                                </h3>
                                {doc.description && (
                                    <p className="text-sm text-slate-600 line-clamp-2 mb-2">
                                        {doc.description}
                                    </p>
                                )}
                                <div className="flex items-center gap-3 text-xs text-slate-500">
                                    <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                                    <span>•</span>
                                    <span>{doc.source === 'google_drive' ? 'Google Drive' : 'Uploaded'}</span>
                                </div>
                            </div>

                            <ExternalLink className="w-5 h-5 text-slate-400 group-hover:text-teal-600 transition-colors flex-shrink-0 mt-1" />
                        </a>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PersonDocuments;
