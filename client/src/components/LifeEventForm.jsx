import React, { useState, useEffect } from 'react';
import { Button, Input } from './ui';
import { X } from 'lucide-react';

const EVENT_TYPES = [
    { value: 'education', label: 'Education' },
    { value: 'work', label: 'Work' },
    { value: 'residence', label: 'Residence' },
    { value: 'military', label: 'Military Service' },
    { value: 'award', label: 'Award/Achievement' },
    { value: 'medical', label: 'Medical' },
    { value: 'travel', label: 'Travel' },
    { value: 'other', label: 'Other' }
];

const LifeEventForm = ({ event, onSave, onCancel, isSaving }) => {
    const [formData, setFormData] = useState({
        event_type: 'other',
        title: '',
        date: '',
        start_date: '',
        end_date: '',
        location: '',
        description: ''
    });

    useEffect(() => {
        if (event) {
            setFormData({
                event_type: event.event_type || 'other',
                title: event.title || '',
                date: event.date || '',
                start_date: event.start_date || '',
                end_date: event.end_date || '',
                location: event.location || '',
                description: event.description || ''
            });
        }
    }, [event]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium text-slate-900">
                    {event ? 'Edit Event' : 'Add New Event'}
                </h3>
                <button
                    type="button"
                    onClick={onCancel}
                    className="text-slate-400 hover:text-slate-600"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Type</label>
                    <select
                        name="event_type"
                        value={formData.event_type}
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                        {EVENT_TYPES.map(type => (
                            <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Date (Single)</label>
                    <Input
                        type="date"
                        name="date"
                        value={formData.date}
                        onChange={handleChange}
                    />
                </div>
            </div>

            <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Title</label>
                <Input
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g., Graduated High School"
                    required
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Start Date (Range)</label>
                    <Input
                        type="date"
                        name="start_date"
                        value={formData.start_date}
                        onChange={handleChange}
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">End Date (Range)</label>
                    <Input
                        type="date"
                        name="end_date"
                        value={formData.end_date}
                        onChange={handleChange}
                    />
                </div>
            </div>

            <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Location</label>
                <Input
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="City, Country"
                />
            </div>

            <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Description</label>
                <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="Add details..."
                />
            </div>

            <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" size="sm" onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" loading={isSaving}>
                    {event ? 'Update Event' : 'Add Event'}
                </Button>
            </div>
        </form>
    );
};

export default LifeEventForm;
