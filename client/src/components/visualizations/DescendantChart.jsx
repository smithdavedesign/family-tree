import React, { useMemo } from 'react';
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

const DescendantChartContent = ({ persons, relationships, rootPersonId, onNodeClick }) => {
    const { nodes, edges } = useMemo(() => {
        if (!rootPersonId || !persons || !relationships) {
            return { nodes: [], edges: [] };
        }

        // Get all descendant IDs
        const descendantIds = getDescendantIds(rootPersonId, persons, relationships);

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
                highlighted: p.id === rootPersonId
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
    }, [rootPersonId, persons, relationships]);

    if (nodes.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-slate-400">
                <p>No descendants found for this person</p>
            </div>
        );
    }

    return (
        <div className="h-full w-full">
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-white px-4 py-2 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold text-slate-900">Descendant Chart</h3>
                <p className="text-sm text-slate-500">Showing {nodes.length} descendant{nodes.length !== 1 ? 's' : ''}</p>
            </div>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                onNodeClick={onNodeClick}
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
