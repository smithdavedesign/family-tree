import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, User as UserIcon } from 'lucide-react';
import { supabase } from '../auth';
import Navbar from '../components/Navbar';

// Fetch aggregated person data
const fetchPersonProfile = async (treeId, personId) => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) throw new Error('Not authenticated');

    // Fetch person details
    const personRes = await fetch(`/api/tree/${treeId}`, {
        headers: { Authorization: `Bearer ${token}` }
    });

    if (!personRes.ok) throw new Error('Failed to fetch person data');

    const treeData = await personRes.json();
    const person = treeData.persons.find(p => p.id === personId);

    if (!person) throw new Error('Person not found');

    // For now, return just the person. We'll add more data fetching later
    return {
        person,
        relationships: treeData.relationships.filter(r =>
            r.person_1_id === personId || r.person_2_id === personId
        ),
        treeName: treeData.name,
        userRole: treeData.role
    };
};

const PersonPage = () => {
    const { treeId, personId } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = React.useState(null);

    React.useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        };
        fetchUser();
    }, []);

    const { data, isLoading, error } = useQuery({
        queryKey: ['personProfile', treeId, personId],
        queryFn: () => fetchPersonProfile(treeId, personId),
        enabled: !!treeId && !!personId,
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col">
                <Navbar user={user} onOpenSettings={() => { }} />
                <div className="flex-1 flex flex-col items-center justify-center gap-4">
                    <p className="text-red-500">Error loading person: {error.message}</p>
                    <button
                        onClick={() => navigate(-1)}
                        className="text-teal-600 hover:underline flex items-center gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    if (!data) return null;

    const { person, relationships, treeName, userRole } = data;
    const isEditor = userRole === 'owner' || userRole === 'editor';

    // Calculate age or lifespan
    const calculateLifespan = () => {
        if (!person.dob) return null;

        const birthYear = new Date(person.dob).getFullYear();
        if (person.dod) {
            const deathYear = new Date(person.dod).getFullYear();
            return `${birthYear}–${deathYear}`;
        }

        const age = new Date().getFullYear() - birthYear;
        return `Age ${age}`;
    };

    const lifespan = calculateLifespan();
    const fullName = `${person.first_name} ${person.middle_name || ''} ${person.last_name || ''}`.trim();

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Navbar */}
            <Navbar
                user={user}
                onOpenSettings={() => { }}
                leftContent={
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate(`/tree/${treeId}`)}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            title="Back to Tree"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div className="flex flex-col">
                            <span className="text-xs text-slate-400">{treeName}</span>
                            <span className="font-semibold text-white">{fullName}</span>
                        </div>
                    </div>
                }
            />

            {/* Main Content */}
            <main className="max-w-6xl mx-auto px-4 py-8">
                {/* Hero Section - Placeholder */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-8">
                    <div className="flex flex-col md:flex-row gap-6 items-start">
                        {/* Profile Photo */}
                        <div className="w-32 h-32 rounded-full overflow-hidden bg-slate-100 flex-shrink-0">
                            {person.profile_photo_url ? (
                                <img
                                    src={person.profile_photo_url}
                                    alt={fullName}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <UserIcon className="w-full h-full p-8 text-slate-300" />
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex-1">
                            <h1 className="text-4xl font-bold text-slate-900 mb-2">{fullName}</h1>
                            {lifespan && (
                                <p className="text-lg text-slate-600 mb-4">{lifespan}</p>
                            )}

                            {/* Quick Tags */}
                            <div className="flex flex-wrap gap-3">
                                {person.pob && (
                                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-full text-sm">
                                        <span className="text-slate-500">📍</span>
                                        <span className="font-medium text-slate-700">{person.pob}</span>
                                    </div>
                                )}
                                {person.occupation && (
                                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-full text-sm">
                                        <span className="text-slate-500">💼</span>
                                        <span className="font-medium text-slate-700">{person.occupation}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    {isEditor && (
                        <div className="flex gap-3 mt-6 pt-6 border-t border-slate-200">
                            <button className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium">
                                Edit Person
                            </button>
                            <button className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium">
                                Add Photo
                            </button>
                            <button className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium">
                                Add Story
                            </button>
                        </div>
                    )}
                </div>

                {/* Content Sections - Placeholders */}
                <div className="grid grid-cols-1 gap-8">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h2 className="text-2xl font-bold text-slate-900 mb-4">Life Timeline</h2>
                        <p className="text-slate-500">Timeline view coming soon...</p>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h2 className="text-2xl font-bold text-slate-900 mb-4">Photos</h2>
                        <p className="text-slate-500">Photo gallery coming soon...</p>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h2 className="text-2xl font-bold text-slate-900 mb-4">Stories</h2>
                        <p className="text-slate-500">Stories section coming soon...</p>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h2 className="text-2xl font-bold text-slate-900 mb-4">Family Connections</h2>
                        <p className="text-slate-500">Relationship map coming soon...</p>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default PersonPage;
