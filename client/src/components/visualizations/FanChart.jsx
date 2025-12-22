import React, { useMemo, useState } from 'react';
import { Home, ChevronUp } from 'lucide-react';
import { buildAncestorTree } from '../../utils/treeUtils';

const FanChart = ({ persons, relationships, centerPersonId, onPersonClick, onRefocus, isZenMode }) => {
    const [hoveredPerson, setHoveredPerson] = useState(null);

    // Get parent of current center
    const getParentId = (personId) => {
        const parentRelationship = relationships.find(r =>
            r.person_2_id === personId && r.type === 'parent_child'
        );
        return parentRelationship?.person_1_id;
    };

    const handleReset = () => {
        if (onRefocus && persons.length > 0) {
            onRefocus(persons[0].id);
        }
    };

    const handleGoToParent = () => {
        const parentId = getParentId(centerPersonId);
        if (parentId && onRefocus) {
            onRefocus(parentId);
        }
    };

    const ancestorTree = useMemo(() => {
        if (!centerPersonId || !persons || !relationships) return null;

        // Debug: What relationships exist for this person?
        const personRelationships = relationships.filter(r =>
            r.person_1_id === centerPersonId || r.person_2_id === centerPersonId
        );

        const parentRelationships = relationships.filter(r =>
            r.person_2_id === centerPersonId && r.type === 'parent_child'
        );

        console.log('Relationship Debug:', {
            centerPersonId,
            centerPerson: persons.find(p => p.id === centerPersonId),
            allRelationships: relationships,
            personRelationships,
            parentRelationships,
            relationshipTypes: [...new Set(relationships.map(r => r.type))]
        });

        const tree = buildAncestorTree(centerPersonId, persons, relationships, 5);
        console.log('Fan Chart Debug:', {
            centerPersonId,
            personsCount: persons?.length,
            relationshipsCount: relationships?.length,
            ancestorTree: tree,
            hasParents: tree?.parents?.length > 0
        });
        return tree;
    }, [centerPersonId, persons, relationships]);

    if (!ancestorTree) {
        return (
            <div className="flex items-center justify-center h-full text-slate-400">
                <p>No ancestor data available</p>
            </div>
        );
    }

    const width = 800;
    const height = 800;
    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.min(width, height) / 2 - 20;

    // Calculate arc paths for each generation
    const generateArcSegments = (tree, startAngle = 0, endAngle = 360, generation = 0) => {
        const segments = [];

        if (!tree) return segments;

        const innerRadius = generation === 0 ? 0 : (generation - 1) * (maxRadius / 5) + 50;
        const outerRadius = generation === 0 ? 50 : generation * (maxRadius / 5) + 50;

        // Current person segment
        if (generation === 0) {
            // Center circle
            segments.push({
                person: tree,
                generation,
                cx: centerX,
                cy: centerY,
                r: 50,
                isCenter: true
            });
        } else {
            // Arc segment
            const midAngle = (startAngle + endAngle) / 2;
            const arcPath = createArcPath(centerX, centerY, innerRadius, outerRadius, startAngle, endAngle);

            segments.push({
                person: tree,
                generation,
                path: arcPath,
                startAngle,
                endAngle,
                midAngle,
                innerRadius,
                outerRadius,
                isCenter: false
            });
        }

        // Recurse for parents
        const parents = tree.parents || [];
        if (parents.length > 0) {
            const anglePerParent = (endAngle - startAngle) / parents.length;
            parents.forEach((parent, index) => {
                const parentStart = startAngle + (index * anglePerParent);
                const parentEnd = parentStart + anglePerParent;
                const parentSegments = generateArcSegments(
                    parent,
                    parentStart,
                    parentEnd,
                    generation + 1
                );
                segments.push(...parentSegments);
            });
        }

        return segments;
    };

    const createArcPath = (cx, cy, innerR, outerR, startAngle, endAngle) => {
        const startAngleRad = (startAngle - 90) * Math.PI / 180;
        const endAngleRad = (endAngle - 90) * Math.PI / 180;

        const x1 = cx + innerR * Math.cos(startAngleRad);
        const y1 = cy + innerR * Math.sin(startAngleRad);
        const x2 = cx + outerR * Math.cos(startAngleRad);
        const y2 = cy + outerR * Math.sin(startAngleRad);
        const x3 = cx + outerR * Math.cos(endAngleRad);
        const y3 = cy + outerR * Math.sin(endAngleRad);
        const x4 = cx + innerR * Math.cos(endAngleRad);
        const y4 = cy + innerR * Math.sin(endAngleRad);

        const largeArc = endAngle - startAngle > 180 ? 1 : 0;

        return `
            M ${x1} ${y1}
            L ${x2} ${y2}
            A ${outerR} ${outerR} 0 ${largeArc} 1 ${x3} ${y3}
            L ${x4} ${y4}
            A ${innerR} ${innerR} 0 ${largeArc} 0 ${x1} ${y1}
            Z
        `;
    };

    const getGenerationColor = (generation) => {
        const colors = [
            '#14b8a6', // teal-500 (center)
            '#06b6d4', // cyan-500
            '#3b82f6', // blue-500
            '#6366f1', // indigo-500
            '#8b5cf6', // violet-500
            '#64748b'  // slate-500
        ];
        return colors[Math.min(generation, colors.length - 1)];
    };

    const segments = useMemo(() => generateArcSegments(ancestorTree), [ancestorTree]);

    const handleSegmentClick = (segment) => {
        if (segment.person && onRefocus) {
            onRefocus(segment.person.id);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center w-full h-full bg-slate-50 relative overflow-hidden">
            {/* Immersive Header with Navigation Controls */}
            <div className={`absolute top-0 left-1/2 transform -translate-x-1/2 z-10 transition-all duration-700 w-full max-w-sm px-4 ${isZenMode ? 'opacity-0 -translate-y-4' : 'opacity-100'}`}>
                <div className="bg-white/95 backdrop-blur-md p-4 rounded-b-3xl shadow-xl border-x border-b border-slate-200/60">
                    <div className="flex flex-col items-center gap-4">
                        <div className="flex items-center gap-3 w-full">
                            <div className="flex-1 border-r border-slate-200 pr-4">
                                <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-0.5">Showing ancestors of</div>
                                <div className="font-bold text-slate-900 truncate">
                                    {persons.find(p => p.id === centerPersonId)?.first_name} {persons.find(p => p.id === centerPersonId)?.last_name || ''}
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={handleReset}
                                    className="p-2.5 text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-all active:scale-95"
                                    title="Reset to root"
                                >
                                    <Home className="w-5 h-5" />
                                </button>

                                <button
                                    onClick={handleGoToParent}
                                    disabled={!getParentId(centerPersonId)}
                                    className="p-2.5 text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 disabled:opacity-30 disabled:grayscale transition-all active:scale-95"
                                    title="Go to parent"
                                >
                                    <ChevronUp className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="w-full h-full flex items-center justify-center p-4">
                <svg
                    viewBox={`0 0 ${width} ${height}`}
                    className="w-full h-full max-w-[min(90vw,90vh)] max-h-[min(90vw,90vh)] drop-shadow-2xl transition-all duration-500"
                    preserveAspectRatio="xMidYMid meet"
                >
                    {/* Background circle */}
                    <circle
                        cx={centerX}
                        cy={centerY}
                        r={maxRadius + 10}
                        fill="#f8fafc"
                        stroke="#e2e8f0"
                        strokeWidth="2"
                    />

                    {/* Render segments */}
                    {segments.map((segment, index) => {
                        const isHovered = hoveredPerson === segment.person.id;
                        const color = getGenerationColor(segment.generation);

                        if (segment.isCenter) {
                            return (
                                <g key={`segment-${index}`}>
                                    <circle
                                        cx={segment.cx}
                                        cy={segment.cy}
                                        r={segment.r}
                                        fill={color}
                                        stroke="white"
                                        strokeWidth="2"
                                        className="cursor-pointer transition-opacity"
                                        opacity={isHovered ? 1 : 0.9}
                                        onMouseEnter={() => setHoveredPerson(segment.person.id)}
                                        onMouseLeave={() => setHoveredPerson(null)}
                                        onClick={() => handleSegmentClick(segment)}
                                    />
                                    <text
                                        x={segment.cx}
                                        y={segment.cy}
                                        textAnchor="middle"
                                        dominantBaseline="middle"
                                        className="text-xs font-medium fill-white pointer-events-none"
                                    >
                                        {segment.person.first_name}
                                    </text>
                                </g>
                            );
                        }

                        return (
                            <g key={`segment-${index}`}>
                                <path
                                    d={segment.path}
                                    fill={color}
                                    stroke="white"
                                    strokeWidth="2"
                                    className="cursor-pointer transition-opacity"
                                    opacity={isHovered ? 1 : 0.85}
                                    onMouseEnter={() => setHoveredPerson(segment.person.id)}
                                    onMouseLeave={() => setHoveredPerson(null)}
                                    onClick={() => handleSegmentClick(segment)}
                                />
                                {/* Text label */}
                                {segment.endAngle - segment.startAngle > 15 && (
                                    <text
                                        x={centerX + ((segment.innerRadius + segment.outerRadius) / 2) * Math.cos((segment.midAngle - 90) * Math.PI / 180)}
                                        y={centerY + ((segment.innerRadius + segment.outerRadius) / 2) * Math.sin((segment.midAngle - 90) * Math.PI / 180)}
                                        textAnchor="middle"
                                        dominantBaseline="middle"
                                        className="text-xs font-medium fill-white pointer-events-none"
                                        transform={`rotate(${segment.midAngle}, ${centerX + ((segment.innerRadius + segment.outerRadius) / 2) * Math.cos((segment.midAngle - 90) * Math.PI / 180)}, ${centerY + ((segment.innerRadius + segment.outerRadius) / 2) * Math.sin((segment.midAngle - 90) * Math.PI / 180)})`}
                                    >
                                        {segment.person.first_name}
                                    </text>
                                )}
                            </g>
                        );
                    })}
                </svg>

                {/* Tooltip - Positioned absolutely to prevent layout shift */}
                {hoveredPerson && (
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 p-3 bg-slate-800 text-white rounded-lg shadow-lg z-10">
                        {(() => {
                            const person = segments.find(s => s.person.id === hoveredPerson)?.person;
                            if (!person) return null;
                            return (
                                <div className="text-sm whitespace-nowrap">
                                    <p className="font-semibold">{person.first_name} {person.last_name || ''}</p>
                                    <p className="text-slate-300 text-xs">
                                        {person.dob ? new Date(person.dob).getFullYear() : '?'} - {person.dod ? new Date(person.dod).getFullYear() : 'Present'}
                                    </p>
                                </div>
                            );
                        })()}
                    </div>
                )}
            </div>
        </div>
    );
};

export default FanChart;
