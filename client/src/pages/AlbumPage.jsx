import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Navbar from '../components/Navbar';
import Breadcrumbs from '../components/Breadcrumbs';
import AlbumManager from '../components/AlbumManager';
import AlbumView from '../components/AlbumView';
import { supabase } from '../auth';

const AlbumPage = () => {
    const { treeId } = useParams();
    const [selectedAlbumId, setSelectedAlbumId] = useState(null);

    // Fetch tree info for role
    const { data: treeData } = useQuery({
        queryKey: ['tree', treeId],
        queryFn: async () => {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch(`/api/tree/${treeId}`, {
                headers: { Authorization: `Bearer ${session?.access_token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch tree');
            return response.json();
        },
        enabled: !!treeId
    });

    const treeName = treeData?.name || 'Family Tree';
    const userRole = treeData?.role || 'viewer';

    // Breadcrumb items
    const breadcrumbItems = [
        { label: 'Trees', path: '/trees' },
        { label: treeName, path: `/tree/${treeId}` },
        { label: 'Albums', path: `/tree/${treeId}/albums` }
    ];

    if (selectedAlbumId && treeData) {
        breadcrumbItems.push({
            label: 'Album Details',
            path: `/tree/${treeId}/album/${selectedAlbumId}`
        });
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 py-6">
                <Breadcrumbs items={breadcrumbItems} />

                <div className="mt-6">
                    {selectedAlbumId ? (
                        <AlbumView
                            albumId={selectedAlbumId}
                            onBack={() => setSelectedAlbumId(null)}
                            userRole={userRole}
                        />
                    ) : (
                        <AlbumManager
                            treeId={treeId}
                            userRole={userRole}
                            onAlbumClick={setSelectedAlbumId}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default AlbumPage;
