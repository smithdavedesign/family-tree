import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

const CustomNode = ({ data }) => {
    const highlightClass = data.highlighted
        ? 'border-yellow-400 bg-yellow-50 shadow-xl ring-4 ring-yellow-200'
        : 'border-stone-400 bg-white';

    return (
        <div className={`px-4 py-2 shadow-md rounded-md border-2 w-64 cursor-pointer hover:border-teal-500 hover:shadow-lg transition-all ${highlightClass}`}>
            <div className="flex items-center">
                <div className="rounded-full w-12 h-12 flex justify-center items-center bg-gray-100 overflow-hidden mr-3">
                    {data.profile_photo_url ? (
                        <img src={data.profile_photo_url} alt={data.label} className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-2xl">👤</span>
                    )}
                </div>
                <div>
                    <div className="text-lg font-bold">{data.label}</div>
                    <div className="text-gray-500 text-sm">{data.subline}</div>
                </div>
            </div>

            <Handle type="target" position={Position.Top} className="w-16 !bg-teal-500" />
            <Handle type="source" position={Position.Bottom} className="w-16 !bg-teal-500" />
        </div>
    );
};

export default memo(CustomNode);
