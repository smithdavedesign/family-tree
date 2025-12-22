import React, { useMemo, useState, useEffect } from 'react';
import ReactFlow, {
    ReactFlowProvider,
    Controls,
    Background,
    MiniMap,
} from 'reactflow';
import dagre from 'dagre';
import 'reactflow/dist/style.css';
import CustomNode from '../CustomNode';
import { getDescendantIds } from '../../utils/treeUtils';
import { Home, ChevronUp } from 'lucide-react';

const nodeWidth = 256;
const nodeHeight = 80;

const getLayoutedElements = (nodes, edges) => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph({
        rankdir: 'TB',
        nodesep: 100,
        ranksep: 150
    });

    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    const layoutedNodes = nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        return {
            ...node,
            targetPosition: 'top',
            sourcePosition: 'bottom',
            position: {
                x: nodeWithPosition.x - nodeWidth / 2,
                y: nodeWithPosition.y - nodeHeight / 2,
            },
        };
    });

    return { nodes: layoutedNodes, edges };
};

const nodeTypes = { custom: CustomNode };

const DescendantChartContent = ({ persons, relationships, rootPersonId, onNodeClick, onRefocus, isZenMode }) => {
    // Current focus is rootPersonId
    const currentRootId = rootPersonId;

    // Get parent of current root
    const getParentId = (personId) => {
        const parentRelationship = relationships.find(r =>
            r.person_2_id === personId && r.type === 'parent_child'
        );
        return parentRelationship?.person_1_id;
    };

    const handleReset = () => {
        // Reset to first person in tree if possible, or just stay put
        if (onRefocus && persons.length > 0) {
            onRefocus(persons[0].id);
        }
    };

    const handleGoToParent = () => {
        const parentId = getParentId(currentRootId);
        if (parentId && onRefocus) {
            onRefocus(parentId);
        }
    };

    const handleInternalNodeClick = (event, node) => {
        if (onRefocus) {
            onRefocus(node.id);
        }
    };

    const currentPerson = persons.find(p => p.id === currentRootId);
    const parentId = getParentId(currentRootId);
    const hasParent = !!parentId;
    const { nodes, edges } = useMemo(() => {
        if (!currentRootId || !persons || !relationships) {
            return { nodes: [], edges: [] };
        }

        // Get all descendant IDs
        const descendantIds = getDescendantIds(currentRootId, persons, relationships);

        // Filter persons to descendants only
        const descendantPersons = persons.filter(p => descendantIds.includes(p.id));

        // Filter relationships to descendants only
        const descendantRelationships = relationships.filter(r =>
            descendantIds.includes(r.person_1_id) && descendantIds.includes(r.person_2_id)
        );

        // Build nodes
        const initialNodes = descendantPersons.map(p => ({
            id: p.id,
            type: 'custom',
            data: {
                id: p.id,
                tree_id: p.tree_id,
                label: `${p.first_name} ${p.last_name || ''}`,
                subline: `${p.dob ? new Date(p.dob).getFullYear() : '?'} - ${p.dod ? new Date(p.dod).getFullYear() : 'Present'}`,
                profile_photo_url: p.profile_photo_url,
                bio: p.bio,
                first_name: p.first_name,
                last_name: p.last_name,
                gender: p.gender,
                dob: p.dob,
                dod: p.dod,
                occupation: p.occupation,
                pob: p.pob,
                highlighted: p.id === currentRootId
            },
            position: { x: 0, y: 0 }
        }));

        // Build edges
        const initialEdges = descendantRelationships.map(r => {
            let edgeStyle = { stroke: '#14b8a6', strokeWidth: 2.5 };
            let label = '';

            if (r.type === 'spouse') {
                label = '❤️';
                edgeStyle = { stroke: '#ec4899', strokeWidth: 3 };
            } else if (r.type === 'adoptive_parent_child') {
                edgeStyle = { strokeDasharray: '8,4', stroke: '#10b981', strokeWidth: 2.5 };
                label = 'Adoptive';
            } else if (r.type === 'step_parent_child') {
                edgeStyle = { strokeDasharray: '8,4', stroke: '#f59e0b', strokeWidth: 2.5 };
                label = 'Step';
            }

            return {
                id: r.id,
                source: r.person_1_id,
                target: r.person_2_id,
                type: 'smoothstep',
                animated: r.type === 'spouse',
                label,
                style: edgeStyle,
                data: { relationshipType: r.type, relationshipId: r.id }
            };
        });

        return getLayoutedElements(initialNodes, initialEdges);
    }, [currentRootId, persons, relationships]);

    if (nodes.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-slate-400">
                <p>No descendants found for this person</p>
            </div>
        );
    }

    return (
        <div className="h-full w-full relative">
            {/* Header with Navigation Controls */}
            <div className={`absolute top-0 left-1/2 transform -translate-x-1/2 z-10 transition-all duration-700 w-full max-w-sm px-4 ${isZenMode ? 'opacity-0 -translate-y-4' : 'opacity-100'}`}>
                <div className="bg-white/95 backdrop-blur-md p-4 rounded-b-3xl shadow-xl border-x border-b border-slate-200/60">
                    <div className="flex flex-col items-center gap-4">
                        <div className="flex items-center gap-3 w-full">
                            <div className="flex-1 border-r border-slate-200 pr-4">
                                <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-0.5">Showing descendants of</div>
                                <div className="font-bold text-slate-900 truncate">
                                    {currentPerson?.first_name} {currentPerson?.last_name || ''}
                                </div>
                                <div className="text-[10px] text-slate-500 font-medium">{nodes.length} descendant{nodes.length !== 1 ? 's' : ''}</div>
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
                                    disabled={!hasParent}
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

            <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                onNodeClick={handleInternalNodeClick}
                fitView
                fitViewOptions={{ padding: 0.2 }}
                minZoom={0.1}
                maxZoom={2}
                nodesDraggable={false}
                nodesConnectable={false}
                elementsSelectable={true}
            >
                <Background />
                <Controls />
                <MiniMap />
            </ReactFlow>
        </div>
    );
};

const DescendantChart = (props) => (
    <ReactFlowProvider>
        <DescendantChartContent {...props} />
    </ReactFlowProvider>
);

export default DescendantChart;
