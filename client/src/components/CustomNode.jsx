import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

const CustomNode = ({ data }) => {
    const highlightClass = data.highlighted
        ? 'ring-4 ring-yellow-300 shadow-xl scale-105'
        : 'border-slate-200 hover:border-teal-400 hover:shadow-lg';

    return (
        <div className={`w-72 bg-white rounded-xl shadow-md border transition-all duration-300 group ${highlightClass}`}>
            <div className="flex items-center p-3">
                <div className="relative">
                    <div className="w-14 h-14 rounded-full bg-slate-100 overflow-hidden border-2 border-white shadow-sm ring-1 ring-slate-100 flex items-center justify-center text-2xl">
                        {data.profile_photo_url ? (
                            <img src={data.profile_photo_url} alt={data.label} className="w-full h-full object-cover" />
                        ) : (
                            <span className="opacity-50">👤</span>
                        )}
                    </div>
                    {data.gender === 'Male' && <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs border border-white shadow-sm">♂</div>}
                    {data.gender === 'Female' && <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center text-xs border border-white shadow-sm">♀</div>}
                </div>

                <div className="ml-4 flex-1 min-w-0">
                    <div className="text-sm font-bold text-slate-800 truncate group-hover:text-teal-700 transition-colors">
                        {data.label}
                    </div>
                    <div className="text-xs text-slate-500 font-medium truncate">
                        {data.subline}
                    </div>
                    {data.occupation && (
                        <div className="text-[10px] text-slate-400 mt-1 truncate uppercase tracking-wide">
                            {data.occupation}
                        </div>
                    )}
                </div>
            </div>

            <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-slate-400 group-hover:!bg-teal-500 transition-colors" />
            <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-slate-400 group-hover:!bg-teal-500 transition-colors" />
        </div>
    );
};

export default memo(CustomNode);
