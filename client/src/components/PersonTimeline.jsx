import React from 'react';
import { Calendar, MapPin, Heart, Baby, Briefcase, GraduationCap, Flag, Image as ImageIcon } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../auth';

const fetchPersonEvents = async (personId) => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    const response = await fetch(`/api/person/${personId}/events`, {
        headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) throw new Error('Failed to fetch events');
    return response.json();
};

const EventIcon = ({ type }) => {
    const iconClass = "w-5 h-5";
    switch (type) {
        case 'birth': return <Baby className={iconClass} />;
        case 'death': return <Calendar className={iconClass} />;
        case 'marriage': return <Heart className={iconClass} />;
        case 'education': return <GraduationCap className={iconClass} />;
        case 'career': return <Briefcase className={iconClass} />;
        case 'achievement': return <Flag className={iconClass} />;
        default: return <Calendar className={iconClass} />;
    }
};

const PersonTimeline = ({ person, personId }) => {
    const { data: events = [], isLoading } = useQuery({
        queryKey: ['personEvents', personId],
        queryFn: () => fetchPersonEvents(personId),
    });

    // Combine birth/death with life events
    const allEvents = [];

    if (person.dob) {
        allEvents.push({
            id: 'birth',
            event_type: 'birth',
            title: 'Born',
            date: person.dob,
            location: person.pob,
            description: `Born in ${person.pob || 'unknown location'}`,
        });
    }

    allEvents.push(...events);

    if (person.dod) {
        allEvents.push({
            id: 'death',
            event_type: 'death',
            title: 'Passed Away',
            date: person.dod,
            location: person.place_of_death,
            description: person.cause_of_death ? `Cause: ${person.cause_of_death}` : undefined,
        });
    }

    // Sort by date
    allEvents.sort((a, b) => {
        const dateA = new Date(a.date || a.start_date);
        const dateB = new Date(b.date || b.start_date);
        return dateA - dateB;
    });

    // Calculate age at each event
    const calculateAge = (eventDate) => {
        if (!person.dob) return null;
        const birth = new Date(person.dob);
        const event = new Date(eventDate);
        return event.getFullYear() - birth.getFullYear();
    };

    if (isLoading) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                    <Calendar className="w-6 h-6 text-teal-600" />
                    Life Timeline
                </h2>
                <div className="animate-pulse space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-20 bg-slate-100 rounded-lg"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                <Calendar className="w-6 h-6 text-teal-600" />
                Life Timeline
            </h2>

            {allEvents.length === 0 ? (
                <p className="text-slate-500 text-center py-8">No life events recorded yet.</p>
            ) : (
                <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-teal-200 via-blue-200 to-slate-200"></div>

                    {/* Events */}
                    <div className="space-y-6">
                        {allEvents.map((event, index) => {
                            const eventDate = new Date(event.date || event.start_date);
                            const age = calculateAge(event.date || event.start_date);
                            const hasPhotos = event.photos && event.photos.length > 0;

                            return (
                                <div key={event.id || index} className="relative pl-16">
                                    {/* Icon circle */}
                                    <div className="absolute left-0 w-12 h-12 bg-gradient-to-br from-teal-500 to-blue-500 rounded-full flex items-center justify-center text-white shadow-lg ring-4 ring-white">
                                        <EventIcon type={event.event_type} />
                                    </div>

                                    {/* Content */}
                                    <div className="bg-slate-50 rounded-xl p-4 hover:bg-slate-100 transition-colors">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-slate-900 text-lg mb-1">
                                                    {event.title}
                                                </h3>
                                                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600 mb-2">
                                                    <span className="font-medium text-teal-600">
                                                        {eventDate.toLocaleDateString(undefined, {
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric'
                                                        })}
                                                    </span>
                                                    {age !== null && (
                                                        <span className="text-slate-500">• Age {age}</span>
                                                    )}
                                                    {event.location && (
                                                        <span className="flex items-center gap-1">
                                                            <MapPin className="w-3 h-3" />
                                                            {event.location}
                                                        </span>
                                                    )}
                                                </div>
                                                {event.description && (
                                                    <p className="text-slate-700 leading-relaxed">
                                                        {event.description}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Event photos */}
                                            {hasPhotos && (
                                                <div className="flex gap-2">
                                                    {event.photos.slice(0, 3).map((photo) => (
                                                        <div
                                                            key={photo.id}
                                                            className="w-16 h-16 rounded-lg overflow-hidden bg-slate-200 flex-shrink-0"
                                                        >
                                                            <img
                                                                src={photo.url}
                                                                alt=""
                                                                className="w-full h-full object-cover"
                                                            />
                                                        </div>
                                                    ))}
                                                    {event.photos.length > 3 && (
                                                        <div className="w-16 h-16 rounded-lg bg-slate-200 flex items-center justify-center text-xs font-medium text-slate-600">
                                                            +{event.photos.length - 3}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PersonTimeline;
