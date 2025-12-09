import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../auth';
import { Globe, MapPin, Camera, Trophy, Loader } from 'lucide-react';
import { Link } from 'react-router-dom';

const GlobalTravelDashboard = () => {
    const { data: stats, isLoading } = useQuery({
        queryKey: ['global-travel-stats'],
        queryFn: async () => {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch('/api/map/global-stats', {
                headers: { Authorization: `Bearer ${session?.access_token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch global stats');
            return response.json();
        }
    });

    if (isLoading) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center justify-center">
                <Loader className="w-6 h-6 text-teal-600 animate-spin" />
            </div>
        );
    }

    if (!stats || stats.total_photos_mapped === 0) {
        return null; // Don't show if no data
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-teal-600" />
                    Global Footprint
                </h3>
            </div>

            <div className="p-4 space-y-4">
                {/* Key Stats */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Countries</p>
                        <p className="text-xl font-bold text-slate-900">{stats.countries_count}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Cities</p>
                        <p className="text-xl font-bold text-slate-900">{stats.total_locations}</p>
                    </div>
                </div>

                {/* Top Cities */}
                {stats.top_cities.length > 0 && (
                    <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Top Destinations</p>
                        <div className="space-y-2">
                            {stats.top_cities.slice(0, 3).map((city, idx) => (
                                <div key={idx} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2 text-slate-700">
                                        <span className="w-4 h-4 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-[10px] font-bold">
                                            {idx + 1}
                                        </span>
                                        <span className="truncate max-w-[150px]">{city.city}</span>
                                    </div>
                                    <span className="text-slate-400 text-xs">{city.count} photos</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Most Global Member */}
                {stats.most_global_member.count > 0 && (
                    <div className="pt-3 border-t border-slate-100">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600">
                                <Trophy className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Most Global Traveler</p>
                                <p className="text-sm font-bold text-slate-900">{stats.most_global_member.name}</p>
                                <p className="text-xs text-slate-400">{stats.most_global_member.count} unique places</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GlobalTravelDashboard;
