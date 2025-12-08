import React, { useState } from 'react';
import { BookOpen, Plus, Edit, Trash2, X, Image as ImageIcon } from 'lucide-react';
import { useStories } from '../hooks/useStories';
import StoryEditor from './StoryEditor';
import PhotoSelector from './PhotoSelector';
import { Button, useToast } from './ui';

const StoryList = ({ personId, treeId, isEditor }) => {
    const { toast } = useToast();
    const { stories, isLoading, createStory, updateStory, deleteStory } = useStories(treeId, personId);
    const [isEditing, setIsEditing] = useState(false);
    const [showPhotoSelector, setShowPhotoSelector] = useState(false);
    const [currentStory, setCurrentStory] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        content: { type: 'doc', content: [{ type: 'paragraph' }] },
        photo_ids: []
    });

    const handleCreate = () => {
        setCurrentStory(null);
        setFormData({
            title: '',
            content: { type: 'doc', content: [{ type: 'paragraph' }] },
            photo_ids: []
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

    // ... handleSave ...

    const handleCancel = () => {
        setIsEditing(false);
        setShowPhotoSelector(false);
        setCurrentStory(null);
        setFormData({
            title: '',
            content: { type: 'doc', content: [{ type: 'paragraph' }] },
            photo_ids: []
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

                    <div className="flex gap-2">
                        <Button variant="primary" onClick={handleSave}>
                            Save Story
                        </Button>
                        <Button variant="outline" onClick={() => setShowPhotoSelector(true)}>
                            <ImageIcon className="w-4 h-4 mr-2" />
                            Attach Photos ({formData.photo_ids?.length || 0})
                        </Button>
                        <Button variant="outline" onClick={handleCancel}>
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
            )}

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
        </div>
    );
};

export default StoryList;
