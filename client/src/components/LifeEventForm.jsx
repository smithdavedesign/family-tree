import React, { useState, useEffect } from 'react';
import { Button, Input } from './ui';
import { X, Image as ImageIcon } from 'lucide-react';
import PhotoSelector from './PhotoSelector';
import LocationSelector from './LocationSelector';

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

const LifeEventForm = ({ event, treeId, onSave, onCancel, isSaving }) => {
    const [showPhotoSelector, setShowPhotoSelector] = useState(false);
    const [formData, setFormData] = useState({
        event_type: 'other',
        title: '',
        date: '',
        start_date: '',
        end_date: '',
        location: '',
        description: '',
        media_ids: []
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
                description: event.description || '',
                media_ids: event.media_ids || []
            });
        }
    }, [event]);

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData(prev => {
            const newData = { ...prev, [name]: value };

            // Mutually exclusive date logic
            if (name === 'date' && value) {
                newData.start_date = '';
                newData.end_date = '';
            } else if ((name === 'start_date' || name === 'end_date') && value) {
                newData.date = '';
            }

            return newData;
        });
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
                        disabled={!!formData.start_date || !!formData.end_date}
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
                        disabled={!!formData.date}
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">End Date (Range)</label>
                    <Input
                        type="date"
                        name="end_date"
                        value={formData.end_date}
                        onChange={handleChange}
                        disabled={!!formData.date}
                    />
                </div>
            </div>

            <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                    Location
                    <span className="text-xs font-normal text-slate-400 ml-1">(Select from known locations to show on map)</span>
                </label>
                <LocationSelector
                    selectedLocations={formData.location ? [{ id: 'current', name: formData.location }] : []}
                    onAdd={(location) => {
                        setFormData(prev => ({ ...prev, location: location.name }));
                    }}
                    onRemove={() => {
                        setFormData(prev => ({ ...prev, location: '' }));
                    }}
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

            {/* Photo Attachment */}
            <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Photos</label>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    fullWidth
                    onClick={() => setShowPhotoSelector(true)}
                    className="flex items-center justify-center gap-2"
                >
                    <ImageIcon className="w-4 h-4" />
                    {formData.media_ids?.length > 0
                        ? `${formData.media_ids.length} Photo${formData.media_ids.length !== 1 ? 's' : ''} Attached`
                        : 'Attach Photos'
                    }
                </Button>
            </div>

            <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" size="sm" onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" loading={isSaving}>
                    {event ? 'Update Event' : 'Add Event'}
                </Button>
            </div>

            {showPhotoSelector && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                        <div className="p-4 border-b border-slate-200 flex justify-between items-center">
                            <h3 className="font-bold text-lg">Select Photos</h3>
                            <button
                                type="button"
                                onClick={() => setShowPhotoSelector(false)}
                                className="p-1 hover:bg-slate-100 rounded-full"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-4 overflow-y-auto">
                            <PhotoSelector
                                treeId={treeId}
                                selectedIds={formData.media_ids || []}
                                onSelectionChange={(ids) => setFormData(prev => ({ ...prev, media_ids: ids }))}
                            />
                        </div>
                        <div className="p-4 border-t border-slate-200 flex justify-end">
                            <Button type="button" onClick={() => setShowPhotoSelector(false)}>
                                Done
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </form>
    );
};

export default LifeEventForm;
