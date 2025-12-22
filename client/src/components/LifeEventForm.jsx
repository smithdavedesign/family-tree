import React, { useState, useEffect } from 'react';
import { Button, Input, Select } from './ui';
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
    const [selectedLocations, setSelectedLocations] = useState([]);
    const [formData, setFormData] = useState({
        event_type: 'other',
        title: '',
        date: '',
        start_date: '',
        end_date: '',
        location: '',
        description: '',
        media_ids: [],
        location_ids: []
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
                media_ids: event.media_ids || [],
                location_ids: event.locations?.map(l => l.id) || []
            });
            setSelectedLocations(event.locations || []);
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
                    <Select
                        label="Type"
                        value={formData.event_type}
                        onChange={(val) => setFormData(prev => ({ ...prev, event_type: val }))}
                        options={EVENT_TYPES.map(type => ({ value: type.value, label: type.label }))}
                        fullWidth
                    />
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
                    selectedLocations={selectedLocations}
                    onAdd={(location) => {
                        setSelectedLocations(prev => [...prev, location]);
                        setFormData(prev => ({
                            ...prev,
                            location: !prev.location ? location.name : prev.location,
                            location_ids: [...prev.location_ids, location.id]
                        }));
                    }}
                    onRemove={(locationId) => {
                        setSelectedLocations(prev => prev.filter(l => l.id !== locationId));
                        setFormData(prev => ({
                            ...prev,
                            location_ids: prev.location_ids.filter(id => id !== locationId)
                        }));
                    }}
                />
            </div>

            <div>
                <Input
                    label="Description"
                    type="textarea"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
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
