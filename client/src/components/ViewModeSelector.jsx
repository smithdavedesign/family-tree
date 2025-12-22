import React from 'react';
import { TreePine, Fan, TrendingDown, Calendar } from 'lucide-react';
import { Select } from './ui';

const ViewModeSelector = ({ viewMode, onChange }) => {
    const modes = [
        { value: 'standard', label: 'Standard Tree', icon: <TreePine /> },
        { value: 'fan', label: 'Ancestor Fan', icon: <Fan /> },
        { value: 'descendant', label: 'Descendants', icon: <TrendingDown /> },
        { value: 'timeline', label: 'Event Chart', icon: <Calendar /> },
    ];

    return (
        <div className="flex items-center gap-2">
            {/* Desktop View: Buttons */}
            <div className="hidden md:flex gap-1.25 p-1.25 bg-slate-100/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-inner">
                {modes.map(({ value: id, label, icon }) => {
                    const isActive = viewMode === id;
                    return (
                        <button
                            key={id}
                            onClick={() => onChange(id)}
                            className={`
                                flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-300
                                ${isActive
                                    ? 'bg-white text-primary-700 shadow-sm border border-slate-200'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                                }
                            `}
                        >
                            {React.cloneElement(icon, { size: 16, className: isActive ? 'text-primary-600' : 'text-slate-400' })}
                            <span className="text-sm font-semibold">{label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Mobile/Compact View: Dropdown */}
            <div className="md:hidden w-full min-w-[200px]">
                <Select
                    value={viewMode}
                    onChange={onChange}
                    options={modes}
                    className="!w-full"
                    fullWidth
                />
            </div>
        </div>
    );
};

export default ViewModeSelector;
