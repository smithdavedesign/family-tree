import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import useTimelineData from '../hooks/useTimelineData';
import TimelineScroller from './TimelineScroller';
import '../styles/timeline.css';

const TimelineContainer = () => {
    const { id } = useParams();
    const { events, loading, error } = useTimelineData(id);

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
            <header className="timeline-header">
                <div className="flex items-center gap-4">
                    <Link to={`/tree/${id}`} className="p-2 hover:bg-gray-100 rounded-full transition">
                        <ArrowLeft className="w-6 h-6 text-gray-600" />
                    </Link>
                    <h1 className="text-xl font-bold text-gray-800">Family Timeline</h1>
                </div>
                <div className="text-sm text-gray-500">
                    {events.length} events found
                </div>
            </header>

            <TimelineScroller events={events} />
        </div>
    );
};

export default TimelineContainer;
