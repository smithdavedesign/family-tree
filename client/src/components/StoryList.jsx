import React, { useState } from 'react';
import { BookOpen, Plus, Edit, Trash2, X, Image as ImageIcon, MapPin } from 'lucide-react';
import { useStories } from '../hooks/useStories';
import StoryEditor from './StoryEditor';
import PhotoSelector from './PhotoSelector';
import LocationSelector from './LocationSelector';
import { Button, useToast } from './ui';

const StoryList = ({ personId, treeId, isEditor }) => {
    const { toast } = useToast();
    const { stories, isLoading, createStory, updateStory, deleteStory } = useStories(treeId, personId);
    const [isEditing, setIsEditing] = useState(false);
    const [showPhotoSelector, setShowPhotoSelector] = useState(false);
    const [currentStory, setCurrentStory] = useState(null);
    const [selectedLocations, setSelectedLocations] = useState([]);
    const [formData, setFormData] = useState({
        title: '',
        content: { type: 'doc', content: [{ type: 'paragraph' }] },
        photo_ids: [],
        location_ids: []
    });

    const handleCreate = () => {
        setCurrentStory(null);
        setSelectedLocations([]);
        setFormData({
            title: '',
            content: { type: 'doc', content: [{ type: 'paragraph' }] },
            photo_ids: [],
            location_ids: []
        });
        setIsEditing(true);
    };

    const handleEdit = (story) => {
        setCurrentStory(story);
        setFormData({
            title: story.title,
            content: story.content,
            photo_ids: story.linked_photos?.map(p => p.id) || []
        });
        setIsEditing(true);
    };

    const handleSave = async () => {
        if (!formData.title.trim()) {
            toast.error('Please enter a title');
            return;
        }

        try {
            if (currentStory) {
                await updateStory({
                    id: currentStory.id,
                    ...formData
                });
                toast.success('Story updated successfully');
            } else {
                await createStory({
                    tree_id: treeId,
                    person_ids: [personId],
                    ...formData
                });
                toast.success('Story created successfully');
            }
            handleCancel();
        } catch (error) {
            console.error('Error saving story:', error);
            toast.error('Failed to save story');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this story?')) {
            try {
                await deleteStory(id);
                toast.success('Story deleted successfully');
            } catch (error) {
                console.error('Error deleting story:', error);
                toast.error('Failed to delete story');
            }
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        setShowPhotoSelector(false);
        setCurrentStory(null);
        setSelectedLocations([]);
        setFormData({
            title: '',
            content: { type: 'doc', content: [{ type: 'paragraph' }] },
            photo_ids: [],
            location_ids: []
        });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    Stories
                </h4>
                {isEditor && !isEditing && (
                    <button
                        onClick={handleCreate}
                        className="p-1 hover:bg-slate-100 rounded transition-colors"
                        title="Write Story"
                    >
                        <Plus className="w-4 h-4 text-teal-600" />
                    </button>
                )}
            </div>

            {/* Story Editor */}
            {isEditing && (
                <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                        <h5 className="font-medium text-slate-900">
                            {currentStory ? 'Edit Story' : 'New Story'}
                        </h5>
                        <button onClick={handleCancel} className="p-1 hover:bg-slate-100 rounded">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <input
                        type="text"
                        placeholder="Story Title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />

                    <StoryEditor
                        content={formData.content}
                        onChange={(content) => setFormData({ ...formData, content })}
                    />

                    {/* Location Selector */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-700 flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            Locations
                        </label>
                        <LocationSelector
                            selectedLocations={selectedLocations}
                            onAdd={(location) => {
                                setSelectedLocations([...selectedLocations, location]);
                                setFormData({ ...formData, location_ids: [...(formData.location_ids || []), location.id] });
                            }}
                            onRemove={(locationId) => {
                                setSelectedLocations(selectedLocations.filter(l => l.id !== locationId));
                                setFormData({ ...formData, location_ids: (formData.location_ids || []).filter(id => id !== locationId) });
                            }}
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <Button variant="primary" fullWidth size="sm" onClick={handleSave}>
                            Save Story
                        </Button>
                        <Button variant="outline" fullWidth size="sm" onClick={() => setShowPhotoSelector(true)}>
                            <ImageIcon className="w-4 h-4 mr-2" />
                            Attach Photos ({formData.photo_ids?.length || 0})
                        </Button>
                        <Button variant="ghost" fullWidth size="sm" onClick={handleCancel}>
                            Cancel
                        </Button>
                    </div>


                    {showPhotoSelector && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
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
                </div>
            )
            }

            {/* Story List */}
            <div className="space-y-2">
                {stories.length === 0 && !isEditing && (
                    <div className="text-center py-8 text-slate-400 text-sm">
                        No stories yet. {isEditor && 'Click + to write one!'}
                    </div>
                )}

                {stories.map((story) => (
                    <div key={story.id} className="bg-slate-50 rounded-lg p-3 hover:bg-slate-100 transition-colors">
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                                <h5 className="font-medium text-slate-900 truncate">{story.title}</h5>
                                <p className="text-xs text-slate-500 mt-1">
                                    {new Date(story.created_at).toLocaleDateString()}
                                </p>
                                {/* Display story locations */}
                                {story.locations && story.locations.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {story.locations.map(location => (
                                            <span
                                                key={location.id}
                                                className="inline-flex items-center gap-1 px-2 py-0.5 bg-teal-100 text-teal-700 rounded text-xs font-medium"
                                            >
                                                <MapPin className="w-3 h-3" />
                                                {location.name}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {isEditor && (
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => handleEdit(story)}
                                        className="p-1 hover:bg-slate-200 rounded"
                                        title="Edit"
                                    >
                                        <Edit className="w-3 h-3" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(story.id)}
                                        className="p-1 hover:bg-red-100 rounded text-red-600"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div >
    );
};

export default StoryList;
