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
import { Undo, Redo } from 'lucide-react';

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
    const [history, setHistory] = useState({ past: [], future: [] });

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
                    tree_id: p.tree_id, // Pass tree_id for relationship fetching
                    label: `${p.first_name} ${p.last_name || ''}`,
                    subline: `${p.dob ? new Date(p.dob).getFullYear() : '?'} - ${p.dod ? new Date(p.dod).getFullYear() : 'Present'}`,
                    profile_photo_url: p.profile_photo_url,
                    bio: p.bio, // Pass bio for side panel
                    // Pass raw fields for editing
                    first_name: p.first_name,
                    last_name: p.last_name,
                    gender: p.gender,
                    dob: p.dob,
                    dod: p.dod,
                    occupation: p.occupation,
                    pob: p.pob
                },
                position: { x: 0, y: 0 } // Layout will handle this
            }));

            // Transform to React Flow edges
            const initialEdges = relationships.map(r => {
                let edgeStyle = {};
                let label = '';

                if (r.type === 'spouse') {
                    label = '❤️';
                } else if (r.type === 'adoptive_parent_child') {
                    edgeStyle = { strokeDasharray: '5,5', stroke: '#10b981' };
                    label = 'Adoptive';
                } else if (r.type === 'step_parent_child') {
                    edgeStyle = { strokeDasharray: '5,5', stroke: '#f59e0b' };
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

    // Command Pattern for Undo/Redo
    const executeCommand = async (command) => {
        const { type, data, undoData } = command;

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            if (type === 'ADD_PERSON') {
                // Do: Create Person + Relationship
                // We assume data contains the full payloads
                // Actually, let's keep it simple: we just call the API
                // But for Undo, we need the ID of the created person.
                // So we execute, get the ID, then push to history.
            }
            // This is getting complex because 'data' might depend on execution result.
            // Let's use a simpler approach:
            // The 'command' object contains 'do' and 'undo' functions? No, can't serialize functions easily if we persist history.
            // But for React state it's fine.
        } catch (e) {
            console.error(e);
        }
    };

    // Simplified Undo/Redo: We just track the *actions* and know how to reverse them.
    const addToHistory = (action) => {
        setHistory(prev => ({
            past: [...prev.past, action],
            future: []
        }));
    };

    const handleUndo = async () => {
        if (history.past.length === 0) return;

        const action = history.past[history.past.length - 1];
        const newPast = history.past.slice(0, -1);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            if (action.type === 'ADD_PERSON') {
                // Undo: Delete the person
                await fetch(`/api/person/${action.data.personId}`, {
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else if (action.type === 'DELETE_PERSON') {
                // Undo: Restore person + relationships + media
                // 1. Restore Person
                await fetch('/api/person', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify(action.data.person)
                });
                // 2. Restore Relationships (one by one)
                for (const rel of action.data.relationships) {
                    await fetch('/api/relationship', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                        body: JSON.stringify(rel)
                    });
                }
                // 3. Restore Media (TODO: Add restore media endpoint or update media controller)
                // For now we skip media restore or assume media table wasn't hard deleted?
                // Our deletePerson controller does not cascade delete media?
                // DB schema says: person_id uuid references public.persons(id) on delete cascade
                // So media IS deleted. We need to restore it.
                // We need to fetch media before delete.
            }

            setHistory({
                past: newPast,
                future: [action, ...history.future]
            });
            fetchTreeData();
        } catch (error) {
            console.error("Undo failed:", error);
            alert("Undo failed");
        }
    };

    const handleRedo = async () => {
        if (history.future.length === 0) return;
        const action = history.future[0];
        const newFuture = history.future.slice(1);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            if (action.type === 'ADD_PERSON') {
                // Redo: Add Person (restore)
                // We need to restore with the SAME ID to keep consistency
                await fetch('/api/person', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify(action.data.person) // We need to ensure we stored the person data in ADD_PERSON action
                });
                // Restore relationship
                await fetch('/api/relationship', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify(action.data.relationship)
                });
            } else if (action.type === 'DELETE_PERSON') {
                // Redo: Delete Person
                await fetch(`/api/person/${action.data.person.id}`, {
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${token}` }
                });
            }

            setHistory({
                past: [...history.past, action],
                future: newFuture
            });
            fetchTreeData();
        } catch (error) {
            console.error("Redo failed:", error);
        }
    };

    const handleMenuAction = async (action, sourceNodeId) => {
        setMenu(null);

        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        if (action === 'delete') {
            if (!confirm('Are you sure you want to delete this person?')) return;

            // 1. Fetch data for Undo
            // We need the person details and their relationships
            // We can find person in 'nodes' state, but we need raw data.
            // 'nodes' state has data in node.data.
            const nodeToDelete = nodes.find(n => n.id === sourceNodeId);

            // We also need relationships. We can find them in 'edges' state?
            // Edges only have source/target. We need the full relationship object (type, etc).
            // We can filter from 'edges' and map back to relationship data if we stored it?
            // Yes, we stored { relationshipType, relationshipId } in edge.data.
            const relatedEdges = edges.filter(e => e.source === sourceNodeId || e.target === sourceNodeId);
            const relationshipsToRestore = relatedEdges.map(e => ({
                id: e.data.relationshipId,
                tree_id: treeId,
                person_1_id: e.source,
                person_2_id: e.target,
                type: e.data.relationshipType
            }));

            const personToRestore = {
                id: nodeToDelete.id,
                tree_id: nodeToDelete.data.tree_id,
                first_name: nodeToDelete.data.first_name,
                last_name: nodeToDelete.data.last_name,
                gender: nodeToDelete.data.gender,
                dob: nodeToDelete.data.dob,
                dod: nodeToDelete.data.dod,
                bio: nodeToDelete.data.bio,
                occupation: nodeToDelete.data.occupation,
                pob: nodeToDelete.data.pob,
                profile_photo_url: nodeToDelete.data.profile_photo_url
            };

            try {
                await fetch(`/api/person/${sourceNodeId}`, {
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${token}` }
                });

                addToHistory({
                    type: 'DELETE_PERSON',
                    data: {
                        person: personToRestore,
                        relationships: relationshipsToRestore
                    }
                });
                fetchTreeData();
            } catch (error) {
                console.error("Delete failed:", error);
            }
            return;
        }

        // Add Person Logic
        try {
            // 1. Create Person
            const newPersonPayload = {
                tree_id: treeId,
                first_name: 'New',
                last_name: 'Person',
                gender: 'Unknown',
                bio: ''
            };

            const newPersonResponse = await fetch('/api/person', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(newPersonPayload)
            });

            if (!newPersonResponse.ok) throw new Error("Failed to create person");
            const newPerson = await newPersonResponse.json();

            // 2. Create Relationship
            let relationshipPayload = {
                tree_id: treeId,
                type: 'parent_child'
            };

            if (action === 'add_parent' || action === 'add_adoptive_parent' || action === 'add_step_parent') {
                relationshipPayload.person_1_id = newPerson.id;
                relationshipPayload.person_2_id = sourceNodeId;
                if (action === 'add_adoptive_parent') relationshipPayload.type = 'adoptive_parent_child';
                else if (action === 'add_step_parent') relationshipPayload.type = 'step_parent_child';
            } else if (action === 'add_child' || action === 'add_adoptive_child' || action === 'add_step_child') {
                relationshipPayload.person_1_id = sourceNodeId;
                relationshipPayload.person_2_id = newPerson.id;
                if (action === 'add_adoptive_child') relationshipPayload.type = 'adoptive_parent_child';
                else if (action === 'add_step_child') relationshipPayload.type = 'step_parent_child';
            } else if (action === 'add_spouse') {
                relationshipPayload.type = 'spouse';
                relationshipPayload.person_1_id = sourceNodeId;
                relationshipPayload.person_2_id = newPerson.id;
            }

            const relResponse = await fetch('/api/relationship', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(relationshipPayload)
            });

            if (!relResponse.ok) throw new Error("Failed to create relationship");
            const newRel = await relResponse.json();

            addToHistory({
                type: 'ADD_PERSON',
                data: {
                    personId: newPerson.id,
                    person: newPerson, // Store for Redo
                    relationship: newRel // Store for Redo
                }
            });

            await fetchTreeData();

            setTimeout(() => {
                const newNode = nodes.find(n => n.id === newPerson.id); // This might be stale closure, but fetchTreeData updates nodes? 
                // Actually fetchTreeData is async, so we need to wait.
                // But nodes state won't update immediately in this closure.
                // We can just pass the ID to onNodeClick if we find it in the DOM or just rely on user finding it.
                // Or we can trigger a selection effect.
            }, 500);

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
                <Panel position="top-right" className="flex gap-2">
                    <div className="flex bg-white rounded shadow overflow-hidden">
                        <button
                            onClick={handleUndo}
                            disabled={history.past.length === 0}
                            className="p-2 hover:bg-gray-100 disabled:opacity-50 border-r"
                            title="Undo"
                        >
                            <Undo size={16} />
                        </button>
                        <button
                            onClick={handleRedo}
                            disabled={history.future.length === 0}
                            className="p-2 hover:bg-gray-100 disabled:opacity-50"
                            title="Redo"
                        >
                            <Redo size={16} />
                        </button>
                    </div>
                    <button className="bg-white p-2 rounded shadow text-sm font-medium" onClick={() => fetchTreeData()}>
                        Refresh
                    </button>
                </Panel>
                {menu && (
                    <div
                        style={{ top: menu.top, left: menu.left }}
                        className="absolute z-50 bg-white border rounded shadow-lg p-2 w-56 flex flex-col gap-1"
                    >
                        <div className="text-xs font-bold text-gray-500 px-2 py-1 uppercase border-b mb-1">
                            Actions
                        </div>
                        <button
                            className="text-left px-2 py-1 hover:bg-gray-100 rounded text-sm"
                            onClick={() => {
                                setMenu(null);
                                const node = nodes.find(n => n.id === menu.id);
                                if (node && onNodeClick) onNodeClick(null, node);
                            }}
                        >
                            Edit Person
                        </button>
                        <div className="border-t my-1"></div>
                        <div className="text-xs font-bold text-gray-500 px-2 py-1 uppercase border-b mb-1">
                            Add Relative
                        </div>
                        <button
                            className="text-left px-2 py-1 hover:bg-gray-100 rounded text-sm"
                            onClick={() => handleMenuAction('add_parent', menu.id)}
                        >
                            Add Biological Parent
                        </button>
                        <button
                            className="text-left px-2 py-1 hover:bg-gray-100 rounded text-sm"
                            onClick={() => handleMenuAction('add_adoptive_parent', menu.id)}
                        >
                            Add Adoptive Parent
                        </button>
                        <button
                            className="text-left px-2 py-1 hover:bg-gray-100 rounded text-sm"
                            onClick={() => handleMenuAction('add_step_parent', menu.id)}
                        >
                            Add Step Parent
                        </button>
                        <div className="border-t my-1"></div>
                        <button
                            className="text-left px-2 py-1 hover:bg-gray-100 rounded text-sm"
                            onClick={() => handleMenuAction('add_child', menu.id)}
                        >
                            Add Biological Child
                        </button>
                        <button
                            className="text-left px-2 py-1 hover:bg-gray-100 rounded text-sm"
                            onClick={() => handleMenuAction('add_adoptive_child', menu.id)}
                        >
                            Add Adoptive Child
                        </button>
                        <button
                            className="text-left px-2 py-1 hover:bg-gray-100 rounded text-sm"
                            onClick={() => handleMenuAction('add_step_child', menu.id)}
                        >
                            Add Step Child
                        </button>
                        <div className="border-t my-1"></div>
                        <button
                            className="text-left px-2 py-1 hover:bg-gray-100 rounded text-sm"
                            onClick={() => handleMenuAction('add_spouse', menu.id)}
                        >
                            Add Spouse/Partner
                        </button>
                        <div className="border-t my-1"></div>
                        <button
                            className="text-left px-2 py-1 hover:bg-red-50 text-red-600 rounded text-sm"
                            onClick={() => handleMenuAction('delete', menu.id)}
                        >
                            Delete Person
                        </button>
                    </div>
                )}
            </ReactFlow>
        </div>
    );
};

export default TreeVisualizer;
