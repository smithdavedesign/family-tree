import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { User } from 'lucide-react';

const CustomNode = ({ data }) => {
    const highlightClass = data.highlighted
        ? 'ring-4 ring-amber-400 shadow-2xl scale-105 bg-gradient-to-br from-white via-white to-amber-50'
        : 'border-slate-200 hover:border-teal-400 hover:shadow-xl';

    // Determine if person is deceased (has death date)
    const isDeceased = data.dod || (data.subline && data.subline.includes('†'));

    return (
        <div className={`w-72 bg-white rounded-2xl shadow-lg border-2 transition-all duration-300 group hover:-translate-y-0.5 ${highlightClass}`}>
            <div className="flex items-center p-4 gap-3">
                {/* Profile Photo */}
                <div className="relative flex-shrink-0">
                    <div className={`w-16 h-16 rounded-full overflow-hidden shadow-md ring-2 ring-white flex items-center justify-center ${data.profile_photo_url ? 'bg-transparent' : 'bg-gradient-to-br from-teal-50 to-blue-50'
                        }`}>
                        {data.profile_photo_url ? (
                            <img
                                src={data.profile_photo_url}
                                alt={data.label}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <User className="w-8 h-8 text-slate-300" />
                        )}
                    </div>

                    {/* Gender Badge */}
                    {data.gender === 'Male' && (
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs border-2 border-white shadow-md font-bold">
                            ♂
                        </div>
                    )}
                    {data.gender === 'Female' && (
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-pink-500 text-white rounded-full flex items-center justify-center text-xs border-2 border-white shadow-md font-bold">
                            ♀
                        </div>
                    )}

                    {/* Deceased Indicator */}
                    {isDeceased && (
                        <div className="absolute -top-1 -left-1 w-5 h-5 bg-slate-600 text-white rounded-full flex items-center justify-center text-xs border-2 border-white shadow-md">
                            †
                        </div>
                    )}
                </div>

                {/* Info Section */}
                <div className="flex-1 min-w-0">
                    <div className="text-base font-bold text-slate-900 truncate group-hover:text-teal-700 transition-colors leading-tight">
                        {data.label}
                    </div>
                    <div className="text-xs text-slate-500 font-medium truncate mt-0.5 leading-tight">
                        {data.subline}
                    </div>
                    {data.occupation && (
                        <div className="text-[10px] text-slate-400 mt-1.5 truncate uppercase tracking-wider font-semibold bg-slate-50 inline-block px-2 py-0.5 rounded-full">
                            {data.occupation}
                        </div>
                    )}
                </div>
            </div>

            {/* Connection Handles */}
            <Handle
                type="target"
                position={Position.Top}
                className="!w-3 !h-3 !bg-teal-400 !border-2 !border-white group-hover:!bg-teal-500 group-hover:!scale-125 transition-all !shadow-md"
            />
            <Handle
                type="source"
                position={Position.Bottom}
                className="!w-3 !h-3 !bg-teal-400 !border-2 !border-white group-hover:!bg-teal-500 group-hover:!scale-125 transition-all !shadow-md"
            />
        </div>
    );
};

export default memo(CustomNode);
