import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, Trash2, MoreVertical } from 'lucide-react';
import { supabase } from '../../auth';
import { Button, useToast } from '../ui';
import Avatar from '../ui/Avatar';

const CommentSection = ({ resourceType, resourceId, treeId }) => {
    const [content, setContent] = useState('');
    const [user, setUser] = useState(null);
    const queryClient = useQueryClient();
    const { toast } = useToast();

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => setUser(data.user));
    }, []);

    // Fetch comments
    const { data: comments = [], isLoading } = useQuery({
        queryKey: ['comments', resourceType, resourceId],
        queryFn: async () => {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch(`/api/comments/${resourceType}/${resourceId}`, {
                headers: { Authorization: `Bearer ${session?.access_token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch comments');
            return response.json();
        }
    });

    // Add comment mutation
    const addMutation = useMutation({
        mutationFn: async (newContent) => {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch('/api/comments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({
                    resource_type: resourceType,
                    resource_id: resourceId,
                    tree_id: treeId,
                    content: newContent
                })
            });
            if (!response.ok) throw new Error('Failed to add comment');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['comments', resourceType, resourceId]);
            setContent('');
            toast.success('Comment added');
        },
        onError: () => {
            toast.error('Failed to add comment');
        }
    });

    // Delete comment mutation
    const deleteMutation = useMutation({
        mutationFn: async (commentId) => {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch(`/api/comments/${commentId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${session?.access_token}` }
            });
            if (!response.ok) throw new Error('Failed to delete comment');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['comments', resourceType, resourceId]);
            toast.success('Comment deleted');
        },
        onError: () => {
            toast.error('Failed to delete comment');
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!content.trim()) return;
        addMutation.mutate(content);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric'
        }).format(date);
    };

    if (isLoading) return <div className="p-4 text-center text-slate-500">Loading comments...</div>;

    return (
        <div className="flex flex-col h-full bg-white w-full">
            <div className="p-4 border-b border-slate-200 bg-slate-50 px-8">
                <h3 className="font-semibold text-slate-800">Comments ({comments.length})</h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 px-8">
                {comments.length === 0 ? (
                    <div className="text-center text-slate-500 py-8">
                        No comments yet. Be the first!
                    </div>
                ) : (
                    comments.map((comment) => (
                        <div key={comment.id} className="flex gap-3 group">
                            <Avatar
                                src={comment.user?.avatar_url}
                                alt={comment.user?.email}
                                size="sm"
                            />
                            <div className="flex-1">
                                <div className="bg-slate-50 rounded-lg p-3">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="font-medium text-sm text-slate-900">
                                            {comment.user?.email || 'User'}
                                        </span>
                                        <span className="text-xs text-slate-500 whitespace-nowrap ml-2">
                                            {formatDate(comment.created_at)}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{comment.content}</p>
                                </div>
                                {(user?.id === comment.user_id) && (
                                    <button
                                        onClick={() => deleteMutation.mutate(comment.id)}
                                        className="text-xs text-red-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity hover:underline"
                                    >
                                        Delete
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 px-8">
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <input
                        type="text"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Write a comment..."
                        className="flex-1 px-3 py-2 text-sm text-slate-900 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder:text-slate-400"
                    />
                    <Button
                        type="submit"
                        size="sm"
                        disabled={!content.trim() || addMutation.isPending}
                    >
                        <Send className="w-4 h-4" />
                    </Button>
                </form>
            </div>
        </div>
    );
};

export default CommentSection;
