import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, User as UserIcon } from 'lucide-react';
import { supabase } from '../auth';
import Navbar from '../components/Navbar';
import Breadcrumbs from '../components/Breadcrumbs';
import PersonHero from '../components/PersonHero';
import PersonTimeline from '../components/PersonTimeline';
import PersonPhotoGallery from '../components/PersonPhotoGallery';
import PersonStories from '../components/PersonStories';
import RelationshipMap from '../components/RelationshipMap';
import PersonDocuments from '../components/PersonDocuments';
import SidePanel from '../components/SidePanel';
import PersonHeatmap from '../components/PersonHeatmap';
import PersonLocations from '../components/PersonLocations';
import { Map as MapIcon } from 'lucide-react';

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
        allPersons: treeData.persons, // Needed for relationship map
        treeName: treeData.name,
        userRole: treeData.role
    };
};

const PersonPage = () => {
    const { treeId, personId } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = React.useState(null);
    const [showSidePanel, setShowSidePanel] = React.useState(false);
    const [refreshKey, setRefreshKey] = React.useState(0);

    React.useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        };
        fetchUser();
    }, []);

    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['personProfile', treeId, personId, refreshKey],
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

    const { person, relationships, allPersons, treeName, userRole } = data;
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

    // Handler functions for actions
    const handleUpdate = () => {
        setRefreshKey(prev => prev + 1);
    };

    const handleEditPerson = () => {
        setShowSidePanel(true);
    };

    // Format person data for SidePanel
    const sidePanelPerson = {
        id: person.id,
        data: {
            ...person,
            label: fullName,
            subline: person.dob ? new Date(person.dob).getFullYear().toString() : '',
            tree_id: treeId
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Navbar */}
            <Navbar
                user={user}
                onOpenSettings={() => { }}
            />

            {/* Breadcrumbs */}
            <Breadcrumbs
                items={[
                    { label: treeName, href: `/tree/${treeId}` },
                    { label: fullName }
                ]}
            />

            {/* Main Content */}
            <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
                {/* Hero Section */}
                <PersonHero
                    person={person}
                    isEditor={isEditor}
                    onEditPerson={handleEditPerson}
                />

                {/* Life Timeline */}
                <PersonTimeline person={person} personId={personId} />

                {/* Photo Gallery */}
                <PersonPhotoGallery personId={personId} />

                {/* Location History (Map) */}
                <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                        <MapIcon className="w-6 h-6 text-teal-600" />
                        Location History
                    </h2>
                    <PersonHeatmap personId={personId} />
                </section>

                {/* Stories */}
                <PersonStories personId={personId} treeId={treeId} />

                {/* Person Locations */}
                <PersonLocations personId={personId} isEditor={isEditor} />

                {/* Documents */}
                <PersonDocuments personId={personId} />

                {/* Family Connections */}
                <RelationshipMap
                    person={person}
                    relationships={relationships}
                    allPersons={allPersons}
                    treeId={treeId}
                />
            </main>

            {showSidePanel && (
                <div className="fixed inset-0 z-[10002] flex items-start justify-end">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setShowSidePanel(false)}
                    />

                    {/* Panel */}
                    <div className="relative w-full max-w-2xl h-full bg-white shadow-2xl overflow-hidden">
                        <SidePanel
                            person={sidePanelPerson}
                            onClose={() => setShowSidePanel(false)}
                            onUpdate={handleUpdate}
                            onOpenPhotoPicker={() => { }}
                            userRole={userRole}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default PersonPage;
