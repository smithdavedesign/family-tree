import React, { useState } from 'react';
import { BookOpen, Plus, Edit, Trash2, X } from 'lucide-react';
import { useStories } from '../hooks/useStories';
import StoryEditor from './StoryEditor';
import { Button, useToast } from './ui';

const StoryList = ({ personId, treeId, isEditor }) => {
    const { toast } = useToast();
    const { stories, isLoading, createStory, updateStory, deleteStory } = useStories(treeId, personId);
    const [isEditing, setIsEditing] = useState(false);
    const [currentStory, setCurrentStory] = useState(null);
    const [formData, setFormData] = useState({ title: '', content: { type: 'doc', content: [{ type: 'paragraph' }] } });

    const handleCreate = () => {
        setCurrentStory(null);
        setFormData({ title: '', content: { type: 'doc', content: [{ type: 'paragraph' }] } });
        setIsEditing(true);
    };

    const handleEdit = (story) => {
        setCurrentStory(story);
        setFormData({ title: story.title, content: story.content });
        setIsEditing(true);
    };

    const handleSave = async () => {
        try {
            if (currentStory) {
                await updateStory({ id: currentStory.id, ...formData });
                toast.success('Story updated');
            } else {
                await createStory({
                    tree_id: treeId,
                    person_ids: personId ? [personId] : [],
                    ...formData
                });
                toast.success('Story created');
            }
            setIsEditing(false);
            setFormData({ title: '', content: { type: 'doc', content: [{ type: 'paragraph' }] } });
        } catch (error) {
            console.error('Error saving story:', error);
            toast.error('Failed to save story');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this story?')) {
            try {
                await deleteStory(id);
                toast.success('Story deleted');
            } catch (error) {
                console.error('Error deleting story:', error);
                toast.error('Failed to delete story');
            }
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        setCurrentStory(null);
        setFormData({ title: '', content: { type: 'doc', content: [{ type: 'paragraph' }] } });
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
                        <Button variant="outline" onClick={handleCancel}>
                            Cancel
                        </Button>
                    </div>
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
