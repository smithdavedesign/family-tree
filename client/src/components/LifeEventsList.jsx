import React, { useState } from 'react';
import { useLifeEvents } from '../hooks/useLifeEvents';
import LifeEventForm from './LifeEventForm';
import { Button } from './ui';
import { Plus, Pencil, Trash2, MapPin, Calendar } from 'lucide-react';

const LifeEventsList = ({ personId, isEditor }) => {
    const { events, isLoading, addEvent, updateEvent, deleteEvent, isAdding, isUpdating, isDeleting } = useLifeEvents(personId);
    const [editingEvent, setEditingEvent] = useState(null);
    const [isCreating, setIsCreating] = useState(false);

    const handleSave = async (data) => {
        try {
            if (editingEvent) {
                await updateEvent({ id: editingEvent.id, ...data });
                setEditingEvent(null);
            } else {
                await addEvent(data);
                setIsCreating(false);
            }
        } catch (error) {
            console.error('Error saving event:', error);
            // Ideally show toast error here
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this event?')) {
            await deleteEvent(id);
        }
    };

    if (isLoading) {
        return <div className="p-4 text-center text-slate-500">Loading events...</div>;
    }

    return (
        <div className="space-y-4">
            {isEditor && !isCreating && !editingEvent && (
                <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Plus className="w-4 h-4" />}
                    onClick={() => setIsCreating(true)}
                    fullWidth
                >
                    Add Life Event
                </Button>
            )}

            {isCreating && (
                <LifeEventForm
                    onSave={handleSave}
                    onCancel={() => setIsCreating(false)}
                    isSaving={isAdding}
                />
            )}

            {editingEvent && (
                <LifeEventForm
                    event={editingEvent}
                    onSave={handleSave}
                    onCancel={() => setEditingEvent(null)}
                    isSaving={isUpdating}
                />
            )}

            <div className="space-y-3">
                {events.map(event => (
                    <div key={event.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                        {/* Don't show this item if it's currently being edited */}
                        {editingEvent?.id === event.id ? null : (
                            <>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-semibold uppercase tracking-wider text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">
                                                {event.event_type}
                                            </span>
                                            <span className="text-xs text-slate-400">
                                                {event.date || (event.start_date ? `${event.start_date} - ${event.end_date || 'Present'}` : 'No date')}
                                            </span>
                                        </div>
                                        <h4 className="font-medium text-slate-900">{event.title}</h4>
                                    </div>
                                    {isEditor && (
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => setEditingEvent(event)}
                                                className="p-1 text-slate-400 hover:text-blue-600 rounded"
                                            >
                                                <Pencil className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(event.id)}
                                                className="p-1 text-slate-400 hover:text-red-600 rounded"
                                                disabled={isDeleting}
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {event.location && (
                                    <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                                        <MapPin className="w-3 h-3" />
                                        {event.location}
                                    </div>
                                )}

                                {event.description && (
                                    <p className="text-sm text-slate-600 mt-2 whitespace-pre-wrap">
                                        {event.description}
                                    </p>
                                )}
                            </>
                        )}
                    </div>
                ))}

                {events.length === 0 && !isCreating && (
                    <div className="text-center py-8 text-slate-500 text-sm">
                        No life events recorded yet.
                    </div>
                )}
            </div>
        </div>
    );
};

export default LifeEventsList;
