import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BookOpen, Plus, Search, Filter, ArrowLeft, Calendar, User, ChevronRight, X, MapPin, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../auth';
import { useStories } from '../hooks/useStories';
import { Button, Input } from '../components/ui';
import Navbar from '../components/Navbar';
import Breadcrumbs from '../components/Breadcrumbs';
import AccountSettings from '../components/AccountSettings';
import StoryEditor from '../components/StoryEditor';
import PhotoSelector from '../components/PhotoSelector';
import LocationSelector from '../components/LocationSelector';
import { useToast } from '../components/ui';

const TreeStoriesPage = () => {
    const { treeId } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [searchQuery, setSearchQuery] = useState('');
    const [showSettings, setShowSettings] = useState(false);
    const [user, setUser] = useState(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [showPhotoSelector, setShowPhotoSelector] = useState(false);
    const [selectedLocations, setSelectedLocations] = useState([]);
    const [formData, setFormData] = useState({
        title: '',
        content: { type: 'doc', content: [{ type: 'paragraph' }] },
        photo_ids: [],
        location_ids: []
    });

    // Fetch current user
    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        };
        fetchUser();
    }, []);

    // Fetch tree details for breadcrumbs and role
    const { data: treeData, isLoading: treeLoading } = useQuery({
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

    const { stories, isLoading: storiesLoading, createStory } = useStories(treeId);

    // Determine if user can edit/create stories
    const canEdit = treeData?.role === 'owner' || treeData?.role === 'editor';

    const handleCreateStory = async () => {
        if (!formData.title.trim()) {
            toast.error('Please enter a title');
            return;
        }

        try {
            await createStory({
                tree_id: treeId,
                ...formData
            });
            toast.success('Story created successfully');
            setIsCreateModalOpen(false);
            setFormData({
                title: '',
                content: { type: 'doc', content: [{ type: 'paragraph' }] },
                photo_ids: [],
                location_ids: []
            });
            setSelectedLocations([]);
        } catch (error) {
            console.error('Error creating story:', error);
            toast.error('Failed to create story');
        }
    };

    // Filter stories based on search query
    const filteredStories = stories.filter(story =>
        story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (story.content?.content?.some(c =>
            c.content?.some(inner => inner.text?.toLowerCase().includes(searchQuery.toLowerCase()))
        ))
    );

    if (treeLoading || storiesLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar user={user} onOpenSettings={() => setShowSettings(true)} />

            <Breadcrumbs
                items={[
                    { label: treeData?.name || 'Tree', href: `/tree/${treeId}` },
                    { label: 'Stories' }
                ]}
            />

            <main className="max-w-6xl mx-auto px-4 py-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3 text-left">
                            <BookOpen className="w-8 h-8 text-teal-600" />
                            Family Stories
                        </h1>
                        <p className="text-slate-500 mt-1 text-left">
                            {stories.length} {stories.length === 1 ? 'story' : 'stories'} shared in {treeData?.name}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="Search stories..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        {canEdit && (
                            <Button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-2 whitespace-nowrap"
                            >
                                <Plus className="w-4 h-4" />
                                New Story
                            </Button>
                        )}
                    </div>
                </div>

                {/* Stories Grid */}
                {filteredStories.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredStories.map((story) => (
                            <Link
                                key={story.id}
                                to={`/story/${story.id}`}
                                className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col group overflow-hidden"
                            >
                                <div className="p-6 flex-1 text-left">
                                    <div className="flex items-center gap-2 text-xs font-semibold text-teal-600 uppercase tracking-wider mb-3">
                                        <BookOpen className="w-3.5 h-3.5" />
                                        Story
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-teal-600 transition-colors mb-2 line-clamp-2">
                                        {story.title}
                                    </h3>
                                    <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
                                        <div className="flex items-center gap-1">
                                            <Calendar className="w-4 h-4" />
                                            <span>{new Date(story.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>

                                    {/* Preview - extract first paragraph if it's text */}
                                    <p className="text-slate-600 line-clamp-3 text-sm leading-relaxed">
                                        {story.content?.content?.[0]?.content?.[0]?.text || "No preview available..."}
                                    </p>
                                </div>
                                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                                    <span className="text-sm font-medium text-teal-600 flex items-center gap-1 group-hover:gap-2 transition-all">
                                        Read Story
                                        <ChevronRight className="w-4 h-4" />
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-200">
                        <div className="max-w-xs mx-auto">
                            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-slate-900 mb-1">No stories found</h3>
                            <p className="text-slate-500">
                                {searchQuery ? `No stories matching "${searchQuery}"` : "This tree doesn't have any stories yet."}
                            </p>
                            {!searchQuery && canEdit && (
                                <Button
                                    variant="outline"
                                    className="mt-6"
                                    onClick={() => setIsCreateModalOpen(true)}
                                >
                                    Write the first story
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </main>

            {/* Create Story Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden text-left">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900">Write New Story</h2>
                                <p className="text-slate-500 text-sm">Preserve a family memory</p>
                            </div>
                            <button
                                onClick={() => setIsCreateModalOpen(false)}
                                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                            >
                                <X className="w-6 h-6 text-slate-400" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            <div className="space-y-2 text-left">
                                <label className="text-sm font-semibold text-slate-700">Story Title</label>
                                <Input
                                    placeholder="Enter a descriptive title..."
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="text-lg font-medium"
                                />
                            </div>

                            <div className="space-y-2 text-left">
                                <label className="text-sm font-semibold text-slate-700">Content</label>
                                <StoryEditor
                                    content={formData.content}
                                    onChange={(content) => setFormData({ ...formData, content })}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 text-left">
                                <div className="space-y-2 text-left">
                                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-teal-600" />
                                        Locations
                                    </label>
                                    <LocationSelector
                                        selectedLocations={selectedLocations}
                                        onAdd={(location) => {
                                            setSelectedLocations([...selectedLocations, location]);
                                            setFormData(prev => ({
                                                ...prev,
                                                location_ids: [...(prev.location_ids || []), location.id]
                                            }));
                                        }}
                                        onRemove={(locationId) => {
                                            setSelectedLocations(selectedLocations.filter(l => l.id !== locationId));
                                            setFormData(prev => ({
                                                ...prev,
                                                location_ids: (prev.location_ids || []).filter(id => id !== locationId)
                                            }));
                                        }}
                                    />
                                </div>
                                <div className="space-y-2 text-left">
                                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                        <ImageIcon className="w-4 h-4 text-teal-600" />
                                        Photos
                                    </label>
                                    <Button
                                        variant="outline"
                                        fullWidth
                                        onClick={() => setShowPhotoSelector(true)}
                                        className="h-[42px] justify-between px-4 border-slate-200"
                                    >
                                        <span className="text-slate-600">
                                            {formData.photo_ids?.length > 0
                                                ? `${formData.photo_ids.length} photos selected`
                                                : "Attach photos to story"}
                                        </span>
                                        <Plus className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                            <Button variant="ghost" onClick={() => setIsCreateModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handleCreateStory}
                                className="bg-teal-600 hover:bg-teal-700 text-white px-8"
                            >
                                Publish Story
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Photo Selector Modal */}
            {showPhotoSelector && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
                        <div className="p-4 border-b border-slate-200 flex justify-between items-center">
                            <h3 className="font-bold text-lg">Select Photos</h3>
                            <button onClick={() => setShowPhotoSelector(false)} className="p-1 hover:bg-slate-100 rounded-full">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-4 overflow-y-auto">
                            <PhotoSelector
                                treeId={treeId}
                                selectedIds={formData.photo_ids || []}
                                onSelectionChange={(ids) => setFormData({ ...formData, photo_ids: ids })}
                            />
                        </div>
                        <div className="p-4 border-t border-slate-200 flex justify-end">
                            <Button onClick={() => setShowPhotoSelector(false)}>
                                Done
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {showSettings && (
                <AccountSettings
                    user={user}
                    onClose={() => setShowSettings(false)}
                />
            )}
        </div>
    );
};

export default TreeStoriesPage;
