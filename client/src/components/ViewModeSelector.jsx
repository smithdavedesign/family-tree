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
        <div className="flex gap-2 bg-white rounded-lg shadow-sm border border-slate-200 p-1">
            {modes.map(({ id, label, icon: Icon }) => {
                const isActive = viewMode === id;
                return (
                    <button
                        key={id}
                        onClick={() => onChange(id)}
                        className={`
                            flex items-center gap-2 px-4 py-2 rounded-md transition-all
                            ${isActive
                                ? 'bg-teal-600 text-white shadow-md'
                                : 'text-slate-600 hover:bg-slate-100'
                            }
                        `}
                        aria-label={label}
                        title={label}
                    >
                        <Icon className="w-4 h-4" />
                        <span className="text-sm font-medium hidden sm:inline">{label}</span>
                    </button>
                );
            })}
        </div>
    );
};

export default ViewModeSelector;
