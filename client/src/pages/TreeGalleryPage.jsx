import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Breadcrumbs from '../components/Breadcrumbs';
import { supabase } from '../auth';
import { Loader, Image as ImageIcon, Filter, Grid as GridIcon, Calendar, User } from 'lucide-react';

const TreeGalleryPage = () => {
    const { id: treeId } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);



    const [photos, setPhotos] = useState([]);
    const [treeName, setTreeName] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // View State
    const [groupBy, setGroupBy] = useState('date'); // 'date' | 'person'
    const [sortOrder, setSortOrder] = useState('desc'); // 'desc' | 'asc'
    const [filterPerson, setFilterPerson] = useState('all');
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);

                // 0. Fetch User
                const { data: { user: currentUser } } = await supabase.auth.getUser();
                setUser(currentUser);

                const token = localStorage.getItem('token');
                const headers = { Authorization: `Bearer ${token}` };

                // 1. Fetch Tree Details (for name & permission check)
                const apiUrl = import.meta.env.VITE_API_URL || '';
                const treeResponse = await fetch(`${apiUrl}/api/tree/${treeId}`, { headers });
                if (!treeResponse.ok) {
                    if (treeResponse.status === 403) throw new Error('You do not have permission to view this tree.');
                    if (treeResponse.status === 404) throw new Error('Tree not found.');
                    throw new Error('Failed to load tree details');
                }
                const treeData = await treeResponse.json();
                setTreeName(treeData.name);

                // 2. Fetch Photos
                const photosResponse = await fetch(`${apiUrl}/api/tree/${treeId}/photos`, { headers });
                if (!photosResponse.ok) throw new Error('Failed to fetch photos');
                const photosData = await photosResponse.json();
                setPhotos(photosData);

            } catch (err) {
                console.error('Error loading gallery:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [treeId]);

    // Grouping Logic
    const groupedPhotos = useMemo(() => {
        let filtered = photos;

        // Filter by Person
        if (filterPerson !== 'all') {
            filtered = filtered.filter(p => p.person_id === filterPerson);
        }

        // Sort
        filtered.sort((a, b) => {
            const dateA = new Date(a.taken_date || a.created_at);
            const dateB = new Date(b.taken_date || b.created_at);
            return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
        });

        if (groupBy === 'person') {
            // Group by Person Name
            const groups = {};
            filtered.forEach(photo => {
                const name = photo.person_name || 'Unknown';
                if (!groups[name]) {
                    groups[name] = {
                        id: photo.person_id,
                        name: name,
                        photo: photo.person_photo,
                        dob: photo.person_dob,
                        items: []
                    };
                }
                groups[name].items.push(photo);
            });
            return Object.values(groups); // Returns array of groups
        } else {
            // Group by Date (Month Year)
            const groups = {};
            filtered.forEach(photo => {
                const date = new Date(photo.taken_date || photo.created_at);
                const key = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                if (!groups[key]) {
                    groups[key] = { title: key, date: date, items: [] };
                }
                groups[key].items.push(photo);
            });
            return Object.values(groups).sort((a, b) => sortOrder === 'desc' ? b.date - a.date : a.date - b.date);
        }
    }, [photos, groupBy, sortOrder, filterPerson]);

    // Unique persons for filter
    const persons = useMemo(() => {
        const unique = new Map();
        photos.forEach(p => {
            if (!unique.has(p.person_id)) {
                unique.set(p.person_id, { id: p.person_id, name: p.person_name });
            }
        });
        return Array.from(unique.values()).sort((a, b) => a.name.localeCompare(b.name));
    }, [photos]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader className="w-8 h-8 text-teal-600 animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center p-8 bg-white rounded-lg shadow-md">
                    <h2 className="text-xl font-bold text-red-600 mb-2">Error</h2>
                    <p className="text-slate-600 mb-4">{error}</p>
                    <button
                        onClick={() => navigate('/trees')}
                        className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar user={user} />

            {/* Breadcrumbs */}
            <Breadcrumbs
                items={[
                    {
                        label: treeName || 'Tree',
                        onClick: () => navigate(`/tree/${treeId}`)
                    },
                    {
                        label: 'Photo Gallery'
                    }
                ]}
            />

            {/* Header / Controls */}
            <div className="sticky top-16 z-30 bg-white border-b border-slate-200 px-4 py-3 shadow-sm">
                <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <ImageIcon className="w-6 h-6 text-teal-600" />
                            Photo Gallery
                        </h1>
                        <span className="text-sm text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                            {photos.length} items
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Group By Toggle */}
                        <div className="flex bg-slate-100 p-1 rounded-lg">
                            <button
                                onClick={() => setGroupBy('date')}
                                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${groupBy === 'date' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                                    }`}
                            >
                                <Calendar className="w-4 h-4 inline mr-1.5" />
                                Date
                            </button>
                            <button
                                onClick={() => setGroupBy('person')}
                                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${groupBy === 'person' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                                    }`}
                            >
                                <User className="w-4 h-4 inline mr-1.5" />
                                Person
                            </button>
                        </div>

                        {/* Person Filter */}
                        <div className="relative">
                            <select
                                value={filterPerson}
                                onChange={(e) => setFilterPerson(e.target.value)}
                                className="pl-9 pr-8 py-1.5 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 appearance-none cursor-pointer hover:bg-slate-50"
                            >
                                <option value="all">All People</option>
                                {persons.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                            <Filter className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Gallery Grid */}
            <div className="max-w-7xl mx-auto px-4 py-6">
                {groupedPhotos.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <ImageIcon className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-900">No photos found</h3>
                        <p className="text-slate-500 mt-1">Try adjusting your filters or upload some photos to your tree.</p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {groupedPhotos.map((group, index) => (
                            <div key={index} className="space-y-3">
                                {/* Group Header */}
                                <div className="flex items-center gap-3 sticky top-32 z-20 bg-slate-50/95 backdrop-blur py-2 -mx-2 px-2 rounded-lg">
                                    {groupBy === 'person' ? (
                                        <>
                                            <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-200 border border-slate-300 flex-shrink-0">
                                                {group.photo ? (
                                                    <img src={group.photo} alt={group.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <User className="w-full h-full p-2 text-slate-400" />
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-slate-800">{group.name}</h3>
                                                {group.dob && (
                                                    <p className="text-xs text-slate-500">Born {new Date(group.dob).getFullYear()}</p>
                                                )}
                                            </div>
                                        </>
                                    ) : (
                                        <h3 className="font-semibold text-slate-700 text-lg">{group.title}</h3>
                                    )}
                                </div>

                                {/* Photos Grid */}
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                    {group.items.map(photo => (
                                        <div
                                            key={photo.id}
                                            className="group relative aspect-square bg-slate-200 rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-all"
                                            onClick={() => console.log('Open lightbox', photo)}
                                        >
                                            <img
                                                src={photo.url}
                                                alt={photo.caption || 'Family photo'}
                                                loading="lazy"
                                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                            />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />

                                            {/* Overlay Info */}
                                            {(photo.caption || photo.location) && (
                                                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <p className="text-white text-xs truncate font-medium">{photo.caption || 'No caption'}</p>
                                                    {photo.location && (
                                                        <p className="text-white/80 text-[10px] truncate">{photo.location}</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TreeGalleryPage;
