import React from 'react';
import { BookOpen, Calendar, User, ArrowRight, MapPin } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '../auth';

const fetchPersonStories = async (personId, treeId) => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    const response = await fetch(`/api/stories?person_id=${personId}`, {
        headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) throw new Error('Failed to fetch stories');
    return response.json();
};

const PersonStories = ({ personId, treeId }) => {
    const { data: stories = [], isLoading } = useQuery({
        queryKey: ['personStories', personId],
        queryFn: () => fetchPersonStories(personId, treeId),
    });

    // Extract preview text from TipTap JSON content
    const getPreview = (content) => {
        if (!content || typeof content !== 'object' || !content.content) {
            return 'No content';
        }

        const textNodes = [];
        const extractText = (node) => {
            if (node.type === 'text') {
                textNodes.push(node.text);
            } else if (node.content) {
                node.content.forEach(extractText);
            }
        };

        content.content.forEach(extractText);
        const fullText = textNodes.join(' ');
        return fullText.length > 200 ? fullText.substring(0, 200) + '...' : fullText;
    };

    if (isLoading) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                    <BookOpen className="w-6 h-6 text-teal-600" />
                    Stories
                </h2>
                <div className="space-y-4">
                    {[1, 2].map(i => (
                        <div key={i} className="h-32 bg-slate-100 rounded-lg animate-pulse"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                    <BookOpen className="w-6 h-6 text-teal-600" />
                    Stories
                    <span className="text-lg font-normal text-slate-500">({stories.length})</span>
                </h2>
            </div>

            {stories.length === 0 ? (
                <div className="text-center py-12">
                    <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 mb-4">No stories yet</p>
                    <p className="text-sm text-slate-400">Stories about this person will appear here</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {stories.map(story => (
                        <Link
                            key={story.id}
                            to={`/story/${story.id}`}
                            className="block group bg-gradient-to-br from-slate-50 to-white rounded-xl p-6 border border-slate-200 hover:border-teal-300 hover:shadow-md transition-all"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-xl font-semibold text-slate-900 mb-2 group-hover:text-teal-600 transition-colors">
                                        {story.title}
                                    </h3>

                                    <p className="text-slate-600 line-clamp-3 leading-relaxed mb-4">
                                        {getPreview(story.content)}
                                    </p>

                                    <div className="flex items-center gap-4 text-sm text-slate-500">
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-4 h-4" />
                                            {new Date(story.created_at).toLocaleDateString()}
                                        </span>
                                        {story.linked_photos && story.linked_photos.length > 0 && (
                                            <span className="flex items-center gap-1">
                                                <BookOpen className="w-4 h-4" />
                                                {story.linked_photos.length} {story.linked_photos.length === 1 ? 'photo' : 'photos'}
                                            </span>
                                        )}
                                        {story.locations && story.locations.length > 0 && (
                                            <span className="flex items-center gap-1 text-teal-600 font-medium">
                                                <MapPin className="w-4 h-4" />
                                                {story.locations.map(l => l.name).join(', ')}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Story photo preview */}
                                {story.linked_photos && story.linked_photos.length > 0 && (
                                    <div className="flex gap-2">
                                        {story.linked_photos.slice(0, 2).map(photo => (
                                            <div key={photo.id} className="w-20 h-20 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                                                <img
                                                    src={photo.url}
                                                    alt=""
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-teal-600 group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PersonStories;
