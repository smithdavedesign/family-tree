import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Calendar, User, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../auth';

const fetchStory = async (id) => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) throw new Error('Not authenticated');

    const apiUrl = import.meta.env.VITE_API_URL || '';
    const response = await fetch(`${apiUrl}/api/stories/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) {
        throw new Error('Failed to fetch story');
    }

    return response.json();
};

const StoryPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const { data: story, isLoading, error } = useQuery({
        queryKey: ['story', id],
        queryFn: () => fetchStory(id),
        enabled: !!id,
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                <p className="text-red-500">Error loading story: {error.message}</p>
                <button onClick={() => navigate(-1)} className="text-teal-600 hover:underline">
                    Go Back
                </button>
            </div>
        );
    }

    if (!story) return null;

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 h-16 flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6 text-slate-600" />
                    </button>
                    <h1 className="text-lg font-semibold text-slate-800 truncate">
                        {story.title}
                    </h1>
                </div>
            </div>

            <main className="max-w-4xl mx-auto px-4 py-8">
                {/* Story Content */}
                <article className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-8">
                        <header className="mb-8">
                            <h1 className="text-3xl font-bold text-slate-900 mb-4">{story.title}</h1>
                            <div className="flex items-center gap-4 text-sm text-slate-500">
                                <div className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    <span>{new Date(story.created_at).toLocaleDateString()}</span>
                                </div>
                                {story.author_id && (
                                    <div className="flex items-center gap-1">
                                        <User className="w-4 h-4" />
                                        <span>Author</span>
                                    </div>
                                )}
                            </div>
                        </header>

                        <div className="prose prose-slate max-w-none mb-12">
                            <p className="whitespace-pre-wrap text-lg leading-relaxed text-slate-700">
                                {story.content}
                            </p>
                        </div>

                        {/* Linked Photos */}
                        {story.linked_photos && story.linked_photos.length > 0 && (
                            <section className="mb-12">
                                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                    <ImageIcon className="w-5 h-5 text-teal-600" />
                                    Attached Photos
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {story.linked_photos.map(photo => (
                                        <div key={photo.id} className="group relative aspect-[4/3] bg-slate-100 rounded-lg overflow-hidden cursor-pointer">
                                            <img
                                                src={photo.url}
                                                alt={photo.caption}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                                                <p className="text-white text-sm font-medium truncate">{photo.caption}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Linked People */}
                        {story.linked_people && story.linked_people.length > 0 && (
                            <section>
                                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                    <User className="w-5 h-5 text-teal-600" />
                                    Mentioned People
                                </h3>
                                <div className="flex flex-wrap gap-3">
                                    {story.linked_people.map(person => (
                                        <Link
                                            key={person.id}
                                            to={`/tree/${story.tree_id}/person/${person.id}`}
                                            className="flex items-center gap-3 p-2 pr-4 bg-slate-50 border border-slate-200 rounded-full hover:bg-white hover:shadow-sm transition-all"
                                        >
                                            <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-200">
                                                {person.profile_photo_url ? (
                                                    <img src={person.profile_photo_url} alt={person.first_name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <User className="w-full h-full p-1.5 text-slate-400" />
                                                )}
                                            </div>
                                            <span className="font-medium text-slate-700">
                                                {person.first_name} {person.last_name}
                                            </span>
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                </article>
            </main>
        </div>
    );
};

export default StoryPage;
