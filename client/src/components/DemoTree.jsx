import React, { useMemo } from 'react';
import ReactFlow, {
    Background,
    Controls,
    ReactFlowProvider
} from 'reactflow';
import dagre from 'dagre';
import 'reactflow/dist/style.css';
import CustomNode from './CustomNode';

const nodeTypes = {
    custom: CustomNode,
};

const nodeWidth = 288;
const nodeHeight = 80;

const getLayoutedElements = (nodes, edges, direction = 'TB') => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    dagreGraph.setGraph({
        rankdir: direction,
        nodesep: 100,
        ranksep: 100
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
            targetPosition: direction === 'LR' ? 'left' : 'top',
            sourcePosition: direction === 'LR' ? 'right' : 'bottom',
            position: {
                x: nodeWithPosition.x - nodeWidth / 2,
                y: nodeWithPosition.y - nodeHeight / 2,
            },
        };
    });

    return { nodes: layoutedNodes, edges };
};

const initialNodes = [
    {
        id: '1',
        type: 'custom',
        data: {
            label: 'William Harrison',
            subline: '1945 - Present',
            gender: 'Male',
            occupation: 'Architect',
            profile_photo_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150&h=150'
        },
    },
    {
        id: '2',
        type: 'custom',
        data: {
            label: 'Eleanor Harrison',
            subline: '1948 - 2021',
            gender: 'Female',
            dod: true,
            occupation: 'Librarian',
            profile_photo_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150&h=150'
        },
    },
    {
        id: '3',
        type: 'custom',
        data: {
            label: 'David Harrison',
            subline: '1972 - Present',
            gender: 'Male',
            occupation: 'Software Engineer',
            profile_photo_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150&h=150'
        },
    },
    {
        id: '4',
        type: 'custom',
        data: {
            label: 'Sarah Miller',
            subline: '1975 - Present',
            gender: 'Female',
            occupation: 'Pediatrician',
            profile_photo_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150&h=150'
        },
    },
    {
        id: '5',
        type: 'custom',
        data: {
            label: 'Emma Harrison',
            subline: '2005 - Present',
            gender: 'Female',
            occupation: 'Student',
            profile_photo_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=150&h=150'
        },
    },
    {
        id: '6',
        type: 'custom',
        data: {
            label: 'James Harrison',
            subline: '2008 - Present',
            gender: 'Male',
            occupation: 'Student',
            profile_photo_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=150&h=150'
        },
    }
];

const initialEdges = [
    { id: 'e1-3', source: '1', target: '3', type: 'smoothstep', animated: true, style: { stroke: '#14b8a6', strokeWidth: 2 } },
    { id: 'e2-3', source: '2', target: '3', type: 'smoothstep', animated: true, style: { stroke: '#14b8a6', strokeWidth: 2 } },
    { id: 'e3-5', source: '3', target: '5', type: 'smoothstep', animated: true, style: { stroke: '#14b8a6', strokeWidth: 2 } },
    { id: 'e3-6', source: '3', target: '6', type: 'smoothstep', animated: true, style: { stroke: '#14b8a6', strokeWidth: 2 } },
    { id: 'e4-5', source: '4', target: '5', type: 'smoothstep', animated: true, style: { stroke: '#14b8a6', strokeWidth: 2 } },
    { id: 'e4-6', source: '4', target: '6', type: 'smoothstep', animated: true, style: { stroke: '#14b8a6', strokeWidth: 2 } },
];

const DemoTree = () => {
    const { nodes, edges } = useMemo(() => getLayoutedElements(initialNodes, initialEdges), []);

    return (
        <div className="w-full h-[500px] rounded-3xl overflow-hidden border border-slate-200 shadow-inner bg-slate-50 relative group">
            <div className="absolute top-6 left-6 z-10 bg-white/80 backdrop-blur-md px-4 py-2 rounded-full border border-teal-100 shadow-sm flex items-center gap-2">
                <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse" />
                <span className="text-xs font-bold text-teal-800 uppercase tracking-widest">Interactive Preview</span>
            </div>

            <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                fitView
                panOnScroll={false}
                zoomOnScroll={false}
                zoomOnPinch={false}
                panOnDrag={true}
                preventScrolling={true}
                nodesConnectable={false}
                nodesDraggable={false}
                className="bg-slate-50/50"
            >
                <Background color="#cbd5e1" gap={20} size={1} />
                <Controls showInteractive={false} className="!bg-white !border-slate-200 !shadow-lg rounded-xl overflow-hidden" />
            </ReactFlow>

            {/* Instruction Overlay */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-slate-900/80 backdrop-blur-md text-white px-4 py-2 rounded-full text-xs font-semibold shadow-xl border border-white/10">
                    Click and drag to explore the tree
                </div>
            </div>
        </div>
    );
};

const DemoTreeWrapper = () => (
    <ReactFlowProvider>
        <DemoTree />
    </ReactFlowProvider>
);

export default DemoTreeWrapper;
