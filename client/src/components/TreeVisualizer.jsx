import React, { useCallback, useEffect, useState } from 'react';
import ReactFlow, {
    addEdge,
    ConnectionLineType,
    Panel,
    useNodesState,
    useEdgesState,
    Controls,
    Background,
} from 'reactflow';
import dagre from 'dagre';
import 'reactflow/dist/style.css';
import CustomNode from './CustomNode';
import { supabase } from '../auth';

const nodeTypes = {
    custom: CustomNode,
};

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 256; // w-64 = 16rem = 256px
const nodeHeight = 80;

const getLayoutedElements = (nodes, edges, direction = 'TB') => {
    const isHorizontal = direction === 'LR';
    dagreGraph.setGraph({ rankdir: direction });

    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    nodes.forEach((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        node.targetPosition = isHorizontal ? 'left' : 'top';
        node.sourcePosition = isHorizontal ? 'right' : 'bottom';

        // We are shifting the dagre node position (anchor=center center) to the top left
        // so it matches the React Flow node anchor point (top left).
        node.position = {
            x: nodeWithPosition.x - nodeWidth / 2,
            y: nodeWithPosition.y - nodeHeight / 2,
        };

        return node;
    });

    return { nodes, edges };
};

const TreeVisualizer = ({ treeId, onNodeClick }) => {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    const fetchTreeData = useCallback(async () => {
        if (!treeId) return;

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            if (!token) {
                console.error("No auth token found");
                return;
            }

            const response = await fetch(`/api/tree/${treeId}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to fetch tree');

            const { persons, relationships } = await response.json();

            // Transform to React Flow nodes
            const initialNodes = persons.map(p => ({
                id: p.id,
                type: 'custom',
                data: {
                    id: p.id, // Pass ID in data for easier access
                    label: `${p.first_name} ${p.last_name || ''}`,
                    subline: `${p.dob ? new Date(p.dob).getFullYear() : '?'} - ${p.dod ? new Date(p.dod).getFullYear() : 'Present'}`,
                    profile_photo_url: p.profile_photo_url,
                    bio: p.bio, // Pass bio for side panel
                    // Pass raw fields for editing
                    first_name: p.first_name,
                    last_name: p.last_name,
                    gender: p.gender,
                    dob: p.dob,
                    dod: p.dod
                },
                position: { x: 0, y: 0 } // Layout will handle this
            }));

            // Transform to React Flow edges
            const initialEdges = relationships.map(r => ({
                id: r.id,
                source: r.person_1_id,
                target: r.person_2_id,
                type: 'smoothstep',
                animated: true,
                label: r.type === 'spouse' ? '❤️' : ''
            }));

            const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
                initialNodes,
                initialEdges
            );

            setNodes(layoutedNodes);
            setEdges(layoutedEdges);

        } catch (error) {
            console.error("Error loading tree:", error);
        }
    }, [treeId, setNodes, setEdges]);

    useEffect(() => {
        fetchTreeData();
    }, [fetchTreeData]);

    const onConnect = useCallback(
        (params) =>
            setEdges((eds) =>
                addEdge({ ...params, type: ConnectionLineType.SmoothStep, animated: true }, eds)
            ),
        [setEdges]
    );

    const [menu, setMenu] = useState(null);

    const onNodeContextMenu = useCallback(
        (event, node) => {
            // Prevent native context menu from showing
            event.preventDefault();

            // Calculate position
            const pane = document.querySelector('.react-flow__pane');
            const paneRect = pane.getBoundingClientRect();

            setMenu({
                id: node.id,
                top: event.clientY - paneRect.top,
                left: event.clientX - paneRect.left,
                data: node.data
            });
        },
        [setMenu]
    );

    const onPaneClick = useCallback(() => setMenu(null), [setMenu]);

    const handleMenuAction = async (action, sourceNodeId) => {
        setMenu(null);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            if (!token) {
                alert("You must be logged in to edit the tree.");
                return;
            }

            // 1. Create the new person
            const newPersonResponse = await fetch('/api/person', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    tree_id: treeId,
                    first_name: 'New',
                    last_name: 'Person',
                    gender: 'Unknown',
                    bio: ''
                })
            });

            if (!newPersonResponse.ok) throw new Error("Failed to create person");
            const newPerson = await newPersonResponse.json();

            // 2. Create the relationship
            let relationshipPayload = {
                tree_id: treeId,
                type: 'parent_child'
            };

            if (action === 'add_parent') {
                // New Person is Parent, Source is Child
                relationshipPayload.person_1_id = newPerson.id;
                relationshipPayload.person_2_id = sourceNodeId;
            } else if (action === 'add_child') {
                // Source is Parent, New Person is Child
                relationshipPayload.person_1_id = sourceNodeId;
                relationshipPayload.person_2_id = newPerson.id;
            } else if (action === 'add_spouse') {
                relationshipPayload.type = 'spouse';
                relationshipPayload.person_1_id = sourceNodeId;
                relationshipPayload.person_2_id = newPerson.id;
            }

            const relResponse = await fetch('/api/relationship', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(relationshipPayload)
            });

            if (!relResponse.ok) throw new Error("Failed to create relationship");

            // 3. Refresh the tree
            fetchTreeData();

        } catch (error) {
            console.error("Error adding relative:", error);
            alert("Failed to add relative");
        }
    };

    return (
        <div className="h-screen w-full relative">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={onNodeClick}
                onNodeContextMenu={onNodeContextMenu}
                onPaneClick={onPaneClick}
                nodeTypes={nodeTypes}
                connectionLineType={ConnectionLineType.SmoothStep}
                fitView
            >
                <Controls />
                <Background color="#aaa" gap={16} />
                <Panel position="top-right">
                    <button className="bg-white p-2 rounded shadow" onClick={() => fetchTreeData()}>
                        Refresh Layout
                    </button>
                </Panel>
                {menu && (
                    <div
                        style={{ top: menu.top, left: menu.left }}
                        className="absolute z-50 bg-white border rounded shadow-lg p-2 w-48 flex flex-col gap-1"
                    >
                        <div className="text-xs font-bold text-gray-500 px-2 py-1 uppercase border-b mb-1">
                            Add Relative
                        </div>
                        <button
                            className="text-left px-2 py-1 hover:bg-gray-100 rounded text-sm"
                            onClick={() => handleMenuAction('add_parent', menu.id)}
                        >
                            Add Parent
                        </button>
                        <button
                            className="text-left px-2 py-1 hover:bg-gray-100 rounded text-sm"
                            onClick={() => handleMenuAction('add_spouse', menu.id)}
                        >
                            Add Spouse
                        </button>
                        <button
                            className="text-left px-2 py-1 hover:bg-gray-100 rounded text-sm"
                            onClick={() => handleMenuAction('add_child', menu.id)}
                        >
                            Add Child
                        </button>
                    </div>
                )}
            </ReactFlow>
        </div>
    );
};

export default TreeVisualizer;
