import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '../../../auth';
import Navbar from '../../../components/Navbar';
import useTimelineData from '../hooks/useTimelineData';
import TimelineScroller from './TimelineScroller';
import '../styles/timeline.css';

import AccountSettings from '../../../components/AccountSettings';

const TimelineContainer = () => {
    const { id } = useParams();
    const { events, persons, loading, error } = useTimelineData(id);
    const [user, setUser] = useState(null);
    const [showSettings, setShowSettings] = useState(false);

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        };
        fetchUser();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-screen text-red-600">
                <h2 className="text-2xl font-bold mb-2">Error Loading Timeline</h2>
                <p>{error}</p>
                <Link to={`/tree/${id}`} className="mt-4 text-blue-600 hover:underline">
                    Return to Tree
                </Link>
            </div>
        );
    }

    return (
        <div className="timeline-container">
            <Navbar
                user={user}
                title="Family Timeline"
                onOpenSettings={() => setShowSettings(true)}
                leftContent={
                    <Link to={`/tree/${id}`} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                        <span className="font-medium hidden sm:inline">Back to Tree</span>
                    </Link>
                }
                rightContent={
                    <div className="text-sm text-slate-500 font-medium bg-slate-100 px-3 py-1 rounded-full">
                        {events.length} Events
                    </div>
                }
            />

            <TimelineScroller events={events} persons={persons} />

            {showSettings && (
                <AccountSettings
                    isOpen={showSettings}
                    onClose={() => setShowSettings(false)}
                    user={user}
                />
            )}
        </div>
    );
};

export default TimelineContainer;
