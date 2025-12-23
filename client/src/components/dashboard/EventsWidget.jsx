import React, { useState } from 'react';
import { useReminders } from '../../hooks/useReminders';
import { Calendar, Gift, Heart, Flag, ChevronDown, ChevronUp } from 'lucide-react';

const EventsWidget = () => {
    const { reminders, isLoading } = useReminders();
    const [showAll, setShowAll] = useState(false);

    if (isLoading) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 animate-pulse">
                <div className="h-4 bg-slate-100 rounded w-1/3 mb-4"></div>
                <div className="space-y-3">
                    <div className="h-12 bg-slate-50 rounded-lg"></div>
                    <div className="h-12 bg-slate-50 rounded-lg"></div>
                </div>
            </div>
        );
    }

    const getIcon = (type) => {
        switch (type) {
            case 'birthday': return <Gift className="w-4 h-4 text-pink-500" />;
            case 'anniversary': return <Heart className="w-4 h-4 text-red-500" />;
            case 'death_anniversary': return <Calendar className="w-4 h-4 text-slate-400" />;
            default: return <Flag className="w-4 h-4 text-teal-500" />;
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        // We want to show the Month/Day, ignoring the year for the display
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    };

    const getRelativeTime = (dateString) => {
        const today = new Date();
        const date = new Date(dateString);
        const eventDate = new Date(today.getFullYear(), date.getMonth(), date.getDate());

        // Handle year wrap-around (e.g. Dec -> Jan)
        if (eventDate < today) {
            eventDate.setFullYear(today.getFullYear() + 1);
        }

        const diffTime = Math.abs(eventDate - today);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Tomorrow';
        return `in ${diffDays} days`;
    };

    const ITEMS_TO_SHOW = 8;
    const displayedEvents = showAll ? reminders : reminders.slice(0, ITEMS_TO_SHOW);
    const hasMore = reminders.length > ITEMS_TO_SHOW;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-teal-600" />
                    Upcoming Events
                </h3>
                <span className="text-xs font-medium text-slate-500 bg-white px-2 py-1 rounded-full border border-slate-200">
                    Next 30 Days
                </span>
            </div>

            <div className="p-2">
                {reminders.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-sm">
                        No upcoming events found.
                    </div>
                ) : (
                    <>
                        <div className="space-y-1">
                            {displayedEvents.map((event) => (
                                <div key={event.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg transition-colors group">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200 group-hover:border-teal-200 group-hover:bg-teal-50 transition-colors">
                                        {getIcon(event.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-medium text-slate-900 truncate">
                                            {event.title}
                                        </h4>
                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                            <span>{formatDate(event.date)}</span>
                                            <span>•</span>
                                            <span className="text-teal-600 font-medium">{getRelativeTime(event.date)}</span>
                                            {event.years > 0 && (
                                                <>
                                                    <span>•</span>
                                                    <span>{event.years} years</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {hasMore && (
                            <button
                                onClick={() => setShowAll(!showAll)}
                                className="w-full mt-2 p-2 text-sm text-teal-600 hover:bg-teal-50 rounded-lg transition-colors flex items-center justify-center gap-1 font-medium"
                            >
                                {showAll ? (
                                    <>
                                        Show less
                                        <ChevronUp className="w-4 h-4" />
                                    </>
                                ) : (
                                    <>
                                        Show {reminders.length - ITEMS_TO_SHOW} more
                                        <ChevronDown className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default EventsWidget;
