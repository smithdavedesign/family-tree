import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { Button, useToast } from './ui';

const LocationModal = ({ isOpen, onClose, onSave, initialData = null }) => {
    const { toast } = useToast();
    const [formData, setFormData] = useState({
        name: initialData?.name || '',
        address: initialData?.address || '',
        latitude: initialData?.latitude || '',
        longitude: initialData?.longitude || '',
        start_date: initialData?.start_date || '',
        end_date: initialData?.end_date || '',
        notes: initialData?.notes || ''
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear error for this field when user types
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
        // Clear coordinates error if either latitude or longitude is changed
        if ((name === 'latitude' || name === 'longitude') && errors.coordinates) {
            setErrors(prev => ({ ...prev, coordinates: null }));
        }
    };

    const validate = () => {
        const newErrors = {};

        // Name is required
        if (!formData.name.trim()) {
            newErrors.name = 'Location name is required';
        }

        // Validate latitude range
        if (formData.latitude) {
            const lat = parseFloat(formData.latitude);
            if (isNaN(lat) || lat < -90 || lat > 90) {
                newErrors.latitude = 'Latitude must be between -90 and 90';
            }
        }

        // Validate longitude range
        if (formData.longitude) {
            const lon = parseFloat(formData.longitude);
            if (isNaN(lon) || lon < -180 || lon > 180) {
                newErrors.longitude = 'Longitude must be between -180 and 180';
            }
        }

        // Validate both coordinates provided together
        if ((formData.latitude && !formData.longitude) || (!formData.latitude && formData.longitude)) {
            newErrors.coordinates = 'Both latitude and longitude are required if providing coordinates';
        }

        // Validate date range
        if (formData.start_date && formData.end_date) {
            if (new Date(formData.end_date) < new Date(formData.start_date)) {
                newErrors.end_date = 'End date must be after start date';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validate()) {
            return;
        }

        setLoading(true);
        try {
            // Clean up data - convert empty strings to null
            const cleanedData = {
                name: formData.name.trim(),
                address: formData.address.trim() || null,
                latitude: formData.latitude ? parseFloat(formData.latitude) : null,
                longitude: formData.longitude ? parseFloat(formData.longitude) : null,
                start_date: formData.start_date || null,
                end_date: formData.end_date || null,
                notes: formData.notes.trim() || null
            };

            await onSave(cleanedData);
            toast.success(initialData ? 'Location updated successfully' : 'Location created successfully');
            onClose();
        } catch (error) {
            console.error('Error saving location:', error);
            toast.error('Failed to save location. Please try again.');
            setErrors({ submit: 'Failed to save location. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-900">
                        {initialData ? 'Edit Location' : 'Add New Location'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Location Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="e.g., New York, NY"
                            required
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${errors.name ? 'border-red-300' : 'border-slate-300'}`}
                        />
                        {errors.name && (
                            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                <AlertCircle className="w-4 h-4" />
                                {errors.name}
                            </p>
                        )}
                    </div>

                    {/* Address */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Address (Optional)
                        </label>
                        <input
                            type="text"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            placeholder="e.g., 123 Main St, New York, NY 10001"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                        />
                    </div>

                    {/* Coordinates */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Latitude
                            </label>
                            <input
                                type="number"
                                name="latitude"
                                value={formData.latitude}
                                onChange={handleChange}
                                placeholder="40.7128"
                                step="any"
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${errors.latitude || errors.coordinates ? 'border-red-300' : 'border-slate-300'}`}
                            />
                            {errors.latitude && (
                                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4" />
                                    {errors.latitude}
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Longitude
                            </label>
                            <input
                                type="number"
                                name="longitude"
                                value={formData.longitude}
                                onChange={handleChange}
                                placeholder="-74.0060"
                                step="any"
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${errors.longitude || errors.coordinates ? 'border-red-300' : 'border-slate-300'}`}
                            />
                            {errors.longitude && (
                                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4" />
                                    {errors.longitude}
                                </p>
                            )}
                        </div>
                    </div>
                    {errors.coordinates && (
                        <p className="text-sm text-red-600 flex items-center gap-1 -mt-2">
                            <AlertCircle className="w-4 h-4" />
                            {errors.coordinates}
                        </p>
                    )}

                    {/* Date Range */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Start Date (Optional)
                            </label>
                            <input
                                type="date"
                                name="start_date"
                                value={formData.start_date}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                End Date (Optional)
                            </label>
                            <input
                                type="date"
                                name="end_date"
                                value={formData.end_date}
                                onChange={handleChange}
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${errors.end_date ? 'border-red-300' : 'border-slate-300'}`}
                            />
                            {errors.end_date && (
                                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4" />
                                    {errors.end_date}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Notes (Optional)
                        </label>
                        <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            rows={3}
                            placeholder="Add any notes about this location..."
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-none"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <Button
                            type="button"
                            variant="ghost"
                            fullWidth
                            onClick={onClose}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            fullWidth
                            loading={loading}
                            disabled={!formData.name.trim()}
                        >
                            {initialData ? 'Update Location' : 'Create Location'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LocationModal;
