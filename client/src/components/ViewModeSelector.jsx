import React from 'react';
import { TreePine, Fan, TrendingDown, Calendar } from 'lucide-react';

const ViewModeSelector = ({ viewMode, onChange }) => {
    const modes = [
        { id: 'standard', label: 'Standard Tree', icon: TreePine },
        { id: 'fan', label: 'Ancestor Fan', icon: Fan },
        { id: 'descendant', label: 'Descendants', icon: TrendingDown },
        { id: 'timeline', label: 'Event Chart', icon: Calendar },
    ];

    return (
        <div className="flex items-center gap-2">
            {/* Desktop View: Buttons */}
            <div className="hidden sm:flex gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
                {modes.map(({ id, label, icon: Icon }) => {
                    const isActive = viewMode === id;
                    return (
                        <button
                            key={id}
                            onClick={() => onChange(id)}
                            className={`
                                flex items-center gap-2 px-4 py-2 rounded-lg transition-all
                                ${isActive
                                    ? 'bg-white text-teal-700 shadow-sm border border-slate-200'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                                }
                            `}
                        >
                            <Icon className="w-4 h-4" />
                            <span className="text-sm font-medium">{label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Mobile View: Dropdown */}
            <div className="sm:hidden w-full">
                <select
                    value={viewMode}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full bg-slate-100 border border-slate-200 text-slate-700 text-sm rounded-xl px-4 py-2 focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_0.5rem_center] bg-no-repeat"
                >
                    {modes.map(({ id, label }) => (
                        <option key={id} value={id}>{label}</option>
                    ))}
                </select>
            </div>
        </div>
    );
};

export default ViewModeSelector;
