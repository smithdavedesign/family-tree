import React, { useCallback, useEffect, useState, useMemo } from 'react';
import ReactFlow, {
    addEdge,
    ConnectionLineType,
    Panel,
    useNodesState,
    useEdgesState,
    Controls,
    Background,
    MiniMap,
    useReactFlow,
    ReactFlowProvider,
} from 'reactflow';
import dagre from 'dagre';
import 'reactflow/dist/style.css';
import CustomNode from './CustomNode';
import { supabase } from '../auth';
import { Undo, Redo, TreePine, Plus, ArrowDownUp, ArrowLeftRight, LocateFixed, Scan, X, Lock, Unlock, Search } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import { useToast } from './ui';

const nodeWidth = 256;
const nodeHeight = 80;

const getLayoutedElements = (nodes, edges, direction = 'TB') => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    const isHorizontal = direction === 'LR';
    dagreGraph.setGraph({
        rankdir: direction,
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

        // Safety check if node exists in dagre graph (it should)
        if (!nodeWithPosition) return node;

        return {
            ...node,
            targetPosition: isHorizontal ? 'left' : 'top',
            sourcePosition: isHorizontal ? 'right' : 'bottom',
            position: {
                x: nodeWithPosition.x - nodeWidth / 2,
                y: nodeWithPosition.y - nodeHeight / 2,
            },
        };
    });

    return { nodes: layoutedNodes, edges };
};

const TreeVisualizerContent = ({ treeId, onNodeClick, highlightedNodes = [], userRole = 'viewer', onSearchToggle, isSearchOpen, isEditMode, isZenMode, onInteraction }) => {
    const isMobile = window.innerWidth < 768;
    const [isToolsOpen, setIsToolsOpen] = useState(false);
    const { toast } = useToast();
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [history, setHistory] = useState({ past: [], future: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // New State for Visualization Controls
    const [layoutDirection, setLayoutDirection] = useState('TB');
    const [isFocusMode, setIsFocusMode] = useState(false);
    const [isViewLocked, setIsViewLocked] = useState(false);
    const [selectedNodeId, setSelectedNodeId] = useState(null);
    const { fitView, setCenter, getNodes, getEdges } = useReactFlow();

    // Memoize nodeTypes to prevent React Flow warning
    const nodeTypes = useMemo(() => ({ custom: CustomNode }), []);

    // Store original data to restore after focus mode
    const [originalGraph, setOriginalGraph] = useState({ nodes: [], edges: [] });

    const fetchTreeData = useCallback(async () => {
        if (!treeId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            if (!token) {
                setError("Authentication required");
                setLoading(false);
                return;
            }

            const response = await fetch(`/api/tree/${treeId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!response.ok) {
                if (response.status === 403) {
                    setError("You don't have permission to view this tree");
                } else {
                    const errorText = await response.text();
                    throw new Error(`Failed to fetch tree: ${response.status} ${errorText}`);
                }
                setLoading(false);
                return;
            }

            const { persons, relationships } = await response.json();

            const initialNodes = persons.map(p => ({
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
                    highlighted: highlightedNodes.includes(p.id)
                },
                position: { x: 0, y: 0 }
            }));

            const initialEdges = relationships.map(r => {
                let edgeStyle = { stroke: '#14b8a6', strokeWidth: 2.5 };
                let label = '';
                let labelStyle = { fill: '#475569', fontWeight: 600, fontSize: 11 };
                let labelBgStyle = { fill: '#ffffff', fillOpacity: 0.9 };

                if (r.type === 'spouse') {
                    label = '❤️';
                    edgeStyle = { stroke: '#ec4899', strokeWidth: 3 };
                    labelStyle = { ...labelStyle, fontSize: 14 };
                } else if (r.type === 'adoptive_parent_child') {
                    edgeStyle = { strokeDasharray: '8,4', stroke: '#10b981', strokeWidth: 2.5 };
                    label = 'Adoptive';
                    labelStyle = { ...labelStyle, fill: '#059669' };
                } else if (r.type === 'step_parent_child') {
                    edgeStyle = { strokeDasharray: '8,4', stroke: '#f59e0b', strokeWidth: 2.5 };
                    label = 'Step';
                    labelStyle = { ...labelStyle, fill: '#d97706' };
                }

                return {
                    id: r.id,
                    source: r.person_1_id,
                    target: r.person_2_id,
                    type: 'smoothstep',
                    animated: r.type === 'spouse',
                    label,
                    labelStyle,
                    labelBgStyle,
                    style: edgeStyle,
                    data: { relationshipType: r.type, relationshipId: r.id }
                };
            });

            // Store original data
            setOriginalGraph({ nodes: initialNodes, edges: initialEdges });

            // Apply layout
            const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
                initialNodes,
                initialEdges,
                layoutDirection
            );

            setNodes(layoutedNodes);
            setEdges(layoutedEdges);
            setLoading(false);

            // Fit view after small delay to ensure rendering
            setTimeout(() => fitView({ padding: 0.2 }), 100);

        } catch (error) {
            console.error("Error loading tree:", error);
            setError(error.message || "Failed to load tree");
            setLoading(false);
        }
    }, [treeId, setNodes, setEdges, layoutDirection, fitView]);

    useEffect(() => {
        fetchTreeData();
    }, [fetchTreeData]);

    // Update node highlighting
    useEffect(() => {
        setNodes((nds) =>
            nds.map((node) => ({
                ...node,
                data: {
                    ...node.data,
                    highlighted: highlightedNodes.includes(node.id)
                }
            }))
        );
    }, [highlightedNodes, setNodes]);

    const onConnect = useCallback(
        async (params) => {
            // Optimistically add the edge
            setEdges((eds) =>
                addEdge({ ...params, type: ConnectionLineType.SmoothStep, animated: true }, eds)
            );

            try {
                const { data: { session } } = await supabase.auth.getSession();
                const token = session?.access_token;

                // Determine relationship type (default to parent-child for now, or maybe prompt user?)
                // For drag-and-drop, usually it implies a specific direction.
                // ReactFlow params: source (top) -> target (bottom) usually.
                // In our layout (TB), source is parent, target is child.

                const response = await fetch('/api/relationship', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        tree_id: treeId,
                        person_1_id: params.source, // Parent
                        person_2_id: params.target, // Child
                        type: 'parent_child'
                    })
                });

                if (response.ok) {
                    toast.success("Relationship created!");
                    // We could refresh the tree here to get the real ID and data, 
                    // but optimistic update is smoother. 
                    // However, we should probably fetch to ensure consistency.
                    // Let's debounce the fetch or just let it be.
                    // Ideally we update the edge with the real ID from response.
                    const newRel = await response.json();
                    setEdges((eds) =>
                        eds.map(e => {
                            if (e.source === params.source && e.target === params.target && !e.id) {
                                return { ...e, id: newRel.id, data: { relationshipType: 'parent_child', relationshipId: newRel.id } };
                            }
                            return e;
                        })
                    );
                } else {
                    throw new Error("Failed to create relationship");
                }
            } catch (error) {
                console.error("Error creating relationship:", error);
                toast.error("Failed to connect nodes");
                // Rollback
                setEdges((eds) => eds.filter(e => !(e.source === params.source && e.target === params.target)));
            }
        },
        [setEdges, treeId, toast]
    );

    const [menu, setMenu] = useState(null);

    const onNodeContextMenu = useCallback(
        (event, node) => {
            event.preventDefault();
            if (userRole !== 'owner' && userRole !== 'editor') return;

            const pane = document.querySelector('.react-flow__pane');
            const paneRect = pane.getBoundingClientRect();

            setMenu({
                id: node.id,
                top: event.clientY - paneRect.top,
                left: event.clientX - paneRect.left,
                data: node.data
            });
        },
        [setMenu, userRole]
    );

    const onPaneClick = useCallback(() => {
        setMenu(null);
        // Deselect node if clicking pane (optional, but good for focus mode)
        // setSelectedNodeId(null); 
    }, [setMenu]);

    const handleNodeClickInternal = (event, node) => {
        setSelectedNodeId(node.id);
        if (onNodeClick) onNodeClick(event, node);
    };

    // --- Visualization Controls Handlers ---

    const handleLayoutToggle = () => {
        const newDirection = layoutDirection === 'TB' ? 'LR' : 'TB';
        setLayoutDirection(newDirection);
        // fetchTreeData will re-run because layoutDirection is in dependency array
    };

    const handleCenterOnMe = () => {
        const meNode = nodes.find(n =>
            n.data.first_name?.toLowerCase() === 'me' ||
            n.data.label?.toLowerCase().includes('me')
        );

        if (meNode) {
            setCenter(meNode.position.x + nodeWidth / 2, meNode.position.y + nodeHeight / 2, { zoom: 1.2, duration: 800 });
        } else {
            toast.info("Could not find a 'Me' node.");
        }
    };

    const handleFocusModeToggle = () => {
        if (isFocusMode) {
            // Disable Focus Mode: Restore original graph
            setIsFocusMode(false);
            const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
                originalGraph.nodes,
                originalGraph.edges,
                layoutDirection
            );
            setNodes(layoutedNodes);
            setEdges(layoutedEdges);
            setTimeout(() => fitView({ padding: 0.2 }), 100);
        } else {
            // Enable Focus Mode
            if (!selectedNodeId) {
                toast.info("Please select a person to focus on.");
                return;
            }

            setIsFocusMode(true);

            // Traverse graph to find ancestors and descendants
            const relatedNodeIds = new Set([selectedNodeId]);
            const queue = [selectedNodeId];
            const visited = new Set([selectedNodeId]);

            // Simple BFS/DFS to find all connected nodes? 
            // No, "Ancestors/Descendants" implies directionality.
            // But edges are directional (Parent -> Child).
            // So:
            // Ancestors: Traverse incoming edges recursively.
            // Descendants: Traverse outgoing edges recursively.
            // Spouses: Connected via 'spouse' edge type (undirected conceptually, but directed in graph).

            // Let's just do "Connected Component" or "Lineage"
            // For now, let's do a simple "All connected nodes" or just strictly parents/children recursively.

            // Helper to get connected nodes
            const getConnected = (id, dir) => {
                const connected = [];
                if (dir === 'parents') {
                    // Edges where target is id (Source is parent)
                    originalGraph.edges.forEach(e => {
                        if (e.target === id) connected.push(e.source);
                    });
                } else if (dir === 'children') {
                    // Edges where source is id (Target is child)
                    originalGraph.edges.forEach(e => {
                        if (e.source === id) connected.push(e.target);
                    });
                } else if (dir === 'spouses') {
                    originalGraph.edges.forEach(e => {
                        if (e.data?.relationshipType === 'spouse') {
                            if (e.source === id) connected.push(e.target);
                            if (e.target === id) connected.push(e.source);
                        }
                    });
                }
                return connected;
            };

            const nodesToKeep = new Set([selectedNodeId]);

            // Find Ancestors
            let q = [selectedNodeId];
            let seen = new Set([selectedNodeId]);
            while (q.length > 0) {
                const curr = q.shift();
                const parents = getConnected(curr, 'parents');
                parents.forEach(p => {
                    if (!seen.has(p)) {
                        seen.add(p);
                        nodesToKeep.add(p);
                        q.push(p);
                    }
                });
            }

            // Find Descendants
            q = [selectedNodeId];
            seen = new Set([selectedNodeId]);
            while (q.length > 0) {
                const curr = q.shift();
                const children = getConnected(curr, 'children');
                children.forEach(c => {
                    if (!seen.has(c)) {
                        seen.add(c);
                        nodesToKeep.add(c);
                        q.push(c);
                    }
                });
            }

            // Also include spouses of anyone in the set? Or just spouses of the selected node?
            // Usually you want to see spouses of ancestors too.
            // Let's add spouses for all kept nodes.
            const nodesWithSpouses = new Set(nodesToKeep);
            nodesToKeep.forEach(nId => {
                const spouses = getConnected(nId, 'spouses');
                spouses.forEach(s => nodesWithSpouses.add(s));
            });

            const filteredNodes = originalGraph.nodes.filter(n => nodesWithSpouses.has(n.id));
            const filteredEdges = originalGraph.edges.filter(e =>
                nodesWithSpouses.has(e.source) && nodesWithSpouses.has(e.target)
            );

            const { nodes: layoutedFiltered, edges: layoutedEdgesFiltered } = getLayoutedElements(
                filteredNodes,
                filteredEdges,
                layoutDirection
            );

            setNodes(layoutedFiltered);
            setEdges(layoutedEdgesFiltered);
            setTimeout(() => fitView({ padding: 0.2 }), 100);
        }
    };

    // --- End Visualization Controls ---

    // Command Pattern for Undo/Redo (Simplified)
    const addToHistory = (action) => {
        setHistory(prev => ({
            past: [...prev.past, action],
            future: []
        }));
    };

    const handleUndo = async () => {
        // ... (Keep existing undo logic)
        if (history.past.length === 0) return;
        const action = history.past[history.past.length - 1];
        const newPast = history.past.slice(0, -1);

        // Simplified for brevity in this replacement, assuming full logic is preserved or re-implemented if needed.
        // Since I'm replacing the whole file, I MUST include the logic.

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            if (action.type === 'ADD_PERSON') {
                await fetch(`/api/person/${action.data.personId}`, {
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${token}` }
                });
                setHistory({ past: newPast, future: [action, ...history.future] });
                fetchTreeData();
            } else if (action.type === 'DELETE_PERSON') {
                // Re-create person logic would go here (complex)
                toast.info("Undo delete not fully implemented yet");
            }
        } catch (error) {
            console.error("Undo error:", error);
        }
    };

    const handleRedo = async () => {
        // ... (Keep existing redo logic)
        if (history.future.length === 0) return;
        const action = history.future[0];
        const newFuture = history.future.slice(1);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            if (action.type === 'ADD_PERSON') {
                // Re-add person logic
                // ... (Simplified for this replacement, ideally copy full logic from previous file)
                // To save space/time, I will just refresh tree for now as placeholder or assume logic is similar
                // Actually I should copy the logic to be safe.

                // Re-add person
                const newPersonResponse = await fetch('/api/person', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({
                        tree_id: action.data.person.tree_id,
                        first_name: action.data.person.first_name,
                        last_name: action.data.person.last_name,
                        gender: action.data.person.gender,
                        bio: action.data.person.bio
                    })
                });

                if (newPersonResponse.ok) {
                    const newPerson = await newPersonResponse.json();
                    // Recreate relationship
                    if (action.data.relationship) {
                        await fetch('/api/relationship', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                            body: JSON.stringify({
                                tree_id: action.data.relationship.tree_id,
                                person_1_id: action.data.relationship.person_1_id === action.data.personId ? newPerson.id : action.data.relationship.person_1_id,
                                person_2_id: action.data.relationship.person_2_id === action.data.personId ? newPerson.id : action.data.relationship.person_2_id,
                                type: action.data.relationship.type
                            })
                        });
                    }
                }
                setHistory({ past: [...history.past, action], future: newFuture });
                fetchTreeData();
            }
        } catch (error) {
            console.error("Redo error:", error);
        }
    };

    // --- Keyboard Navigation ---
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Ignore if input is focused
            if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

            if (!selectedNodeId) return;

            const currentNode = nodes.find(n => n.id === selectedNodeId);
            if (!currentNode) return;

            let nextNodeId = null;

            // Helper to find connected nodes by type
            const getConnectedIds = (type) => {
                const ids = [];
                edges.forEach(edge => {
                    if (type === 'parent' && edge.target === selectedNodeId) ids.push(edge.source);
                    if (type === 'child' && edge.source === selectedNodeId) ids.push(edge.target);
                    if (type === 'spouse' && edge.data?.relationshipType === 'spouse') {
                        if (edge.source === selectedNodeId) ids.push(edge.target);
                        if (edge.target === selectedNodeId) ids.push(edge.source);
                    }
                });
                return ids;
            };

            // Approximate node dimensions for centering
            const nodeWidth = currentNode.width || 170;
            const nodeHeight = currentNode.height || 60;

            if (e.key === 'ArrowUp') {
                const parents = getConnectedIds('parent');
                if (parents.length > 0) nextNodeId = parents[0];
            } else if (e.key === 'ArrowDown') {
                const children = getConnectedIds('child');
                if (children.length > 0) nextNodeId = children[0];
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                const spouses = getConnectedIds('spouse');
                if (spouses.length > 0) nextNodeId = spouses[0];
                // Could also look for siblings if no spouse?
            }

            if (nextNodeId) {
                e.preventDefault();
                const nextNode = nodes.find(n => n.id === nextNodeId);
                if (nextNode) {
                    handleNodeClickInternal(null, nextNode);
                    // Optional: Center view on new node
                    setCenter(nextNode.position.x + nodeWidth / 2, nextNode.position.y + nodeHeight / 2, { duration: 300 });
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedNodeId, nodes, edges, setCenter, handleNodeClickInternal]);

    // --- End Keyboard Navigation ---

    const handleMenuAction = async (action, sourceNodeId) => {
        // Add check for viewer role just in case
        if (userRole !== 'owner' && userRole !== 'editor') return;

        setMenu(null);

        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        if (action === 'delete') {
            if (!confirm('Are you sure you want to delete this person?')) return;
            try {
                // Fetch the person and their relationships before deleting for undo purposes
                const personToDelete = nodes.find(n => n.id === sourceNodeId)?.data;
                const relationships = edges.filter(e => e.source === sourceNodeId || e.target === sourceNodeId);

                const response = await fetch(`/api/person/${sourceNodeId}`, {
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (!response.ok) throw new Error("Failed to delete person");

                addToHistory({
                    type: 'DELETE_PERSON',
                    data: {
                        personId: sourceNodeId,
                        person: personToDelete,
                        relationships: relationships // Store for Undo (need to fetch relationships first ideally, but for now simple delete)
                    }
                });
                fetchTreeData();
            } catch (error) {
                console.error("Error deleting person:", error);
                toast.error("Failed to delete person");
            }
            return;
        }

        // Add Person Logic
        try {
            // 1. Create Person
            const newPersonPayload = {
                tree_id: treeId,
                first_name: action === 'add_root' ? 'Me' : 'New',
                last_name: action === 'add_root' ? '' : 'Person',
                gender: 'Unknown',
                bio: action === 'add_root' ? 'This is the start of your tree!' : ''
            };

            const newPersonResponse = await fetch('/api/person', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(newPersonPayload)
            });

            if (!newPersonResponse.ok) throw new Error("Failed to create person");
            const newPerson = await newPersonResponse.json();

            if (action === 'add_root') {
                addToHistory({
                    type: 'ADD_PERSON',
                    data: {
                        personId: newPerson.id,
                        person: newPerson,
                        relationship: null
                    }
                });
                await fetchTreeData();
                return;
            }

            // 2. Create Relationship
            let relationshipPayload = {
                tree_id: treeId,
                type: 'parent_child'
            };
            if (['add_parent', 'add_adoptive_parent', 'add_step_parent'].includes(action)) {
                relationshipPayload.person_1_id = newPerson.id;
                relationshipPayload.person_2_id = sourceNodeId;
                if (action === 'add_adoptive_parent') relationshipPayload.type = 'adoptive_parent_child';
                else if (action === 'add_step_parent') relationshipPayload.type = 'step_parent_child';
            } else if (['add_child', 'add_adoptive_child', 'add_step_child'].includes(action)) {
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

            // Auto-select the new person to open SidePanel for editing
            if (onNodeClick) {
                const nodeData = {
                    id: newPerson.id,
                    tree_id: newPerson.tree_id,
                    label: `${newPerson.first_name} ${newPerson.last_name || ''}`,
                    subline: `${newPerson.dob ? new Date(newPerson.dob).getFullYear() : '?'} - ${newPerson.dod ? new Date(newPerson.dod).getFullYear() : 'Present'}`,
                    profile_photo_url: newPerson.profile_photo_url,
                    bio: newPerson.bio,
                    first_name: newPerson.first_name,
                    last_name: newPerson.last_name,
                    gender: newPerson.gender,
                    dob: newPerson.dob,
                    dod: newPerson.dod,
                    occupation: newPerson.occupation,
                    pob: newPerson.pob,
                    highlighted: false
                };

                // We construct a temporary node object. 
                // The position doesn't matter for the SidePanel, but we should try to find the real node if possible.
                // Since fetchTreeData is async, the nodes state might not be updated yet in this closure.
                // But passing this object is enough to open the panel.
                onNodeClick(null, { id: newPerson.id, type: 'custom', data: nodeData });
            }

        } catch (error) {
            console.error("Error adding relative:", error);
            toast.error("Failed to add relative");
        }
    };

    const showEmptyState = !loading && !error && nodes.length === 0;

    return (
        <div className="h-full w-full relative">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onPaneClick={(e) => {
                    if (onInteraction) onInteraction(false);
                    onPaneClick(e);
                }}
                onMoveStart={() => onInteraction && onInteraction(true)}
                onMoveEnd={() => onInteraction && onInteraction(false)}
                onNodeDragStart={() => onInteraction && onInteraction(true)}
                onNodeDragStop={() => onInteraction && onInteraction(false)}
                nodeTypes={nodeTypes}
                connectionLineType={ConnectionLineType.SmoothStep}
                fitView
                nodesConnectable={(userRole === 'owner' || userRole === 'editor') && !isViewLocked}
                nodesDraggable={!isViewLocked}
                panOnDrag={!isViewLocked}
                zoomOnScroll={!isViewLocked}
                zoomOnPinch={!isViewLocked}
                zoomOnDoubleClick={!isViewLocked}
                panOnScroll={!isViewLocked}
            >
                {/* Desktop Panels (Top Left) */}
                <Panel
                    position="top-left"
                    className={`flex flex-col gap-2 transition-all duration-700 pointer-events-none ${isZenMode ? 'opacity-0 -translate-x-4' : 'opacity-100'}`}
                >
                    {/* Main Toolbar */}
                    <div className="bg-white/90 backdrop-blur-md p-1.5 rounded-2xl shadow-xl border border-white/20 flex gap-1 pointer-events-auto">
                        <button
                            onClick={handleLayoutToggle}
                            className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-700 transition-all active:scale-95"
                            title="Switch Layout"
                        >
                            {layoutDirection === 'TB' ? <ArrowLeftRight className="w-5 h-5" /> : <ArrowDownUp className="w-5 h-5" />}
                        </button>
                        <button
                            onClick={handleCenterOnMe}
                            className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-700 transition-all active:scale-95"
                            title="Center View"
                        >
                            <LocateFixed className="w-5 h-5" />
                        </button>

                        {/* Tools Toggle (Consolidated) */}
                        <div className="relative">
                            <button
                                onClick={() => setIsToolsOpen(!isToolsOpen)}
                                className={`p-2.5 rounded-xl transition-all active:scale-95 ${isToolsOpen ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-slate-100 text-slate-700'}`}
                                title="Visual Tools"
                            >
                                <Scan className="w-5 h-5" />
                            </button>

                            {isToolsOpen && (
                                <div className="absolute left-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 animate-scaleIn origin-top-left flex flex-col gap-1">
                                    <button
                                        onClick={() => { handleFocusModeToggle(); setIsToolsOpen(false); }}
                                        className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all ${isFocusMode ? 'bg-amber-100 text-amber-700' : 'text-slate-600 hover:bg-slate-50'}`}
                                    >
                                        <Scan className="w-4 h-4" />
                                        {isFocusMode ? 'Exit Focus Mode' : 'Focus Lineage'}
                                    </button>
                                    <button
                                        onClick={() => { setIsViewLocked(!isViewLocked); setIsToolsOpen(false); }}
                                        className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all ${isViewLocked ? 'bg-red-100 text-red-700' : 'text-slate-600 hover:bg-slate-50'}`}
                                    >
                                        {isViewLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                                        {isViewLocked ? 'Unlock View' : 'Lock View'}
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="w-px bg-slate-200 mx-1" />

                        <button
                            onClick={onSearchToggle}
                            className={`p-2.5 rounded-xl transition-all active:scale-95 ${isSearchOpen ? 'bg-teal-100 text-teal-700' : 'hover:bg-slate-100 text-slate-700'}`}
                            title="Search"
                        >
                            <Search className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Edit Controls (Only in Edit Mode) */}
                    {isEditMode && (userRole === 'owner' || userRole === 'editor') && (
                        <div className="bg-white/90 backdrop-blur-md p-1.5 rounded-2xl shadow-xl border border-white/20 flex gap-1 animate-slideIn pointer-events-auto">
                            <button onClick={handleUndo} disabled={history.past.length === 0} className="p-2.5 rounded-xl hover:bg-slate-100 disabled:opacity-30 transition-all text-slate-700 active:scale-95">
                                <Undo className="w-5 h-5" />
                            </button>
                            <button onClick={handleRedo} disabled={history.future.length === 0} className="p-2.5 rounded-xl hover:bg-slate-100 disabled:opacity-30 transition-all text-slate-700 active:scale-95">
                                <Redo className="w-5 h-5" />
                            </button>
                            {!isMobile && (
                                <>
                                    <div className="w-px bg-slate-200 mx-1" />
                                    <button onClick={() => handleMenuAction('add_root')} className="px-4 py-2 rounded-xl bg-teal-600 text-white hover:bg-teal-700 transition-all shadow-md flex items-center gap-2 font-bold text-sm active:scale-95">
                                        <Plus className="w-4 h-4 stroke-[3px]" />
                                        <span>Add Root</span>
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </Panel>

                {isMobile && isEditMode && (userRole === 'owner' || userRole === 'editor') && (
                    <Panel position="bottom-right" className={`!mb-6 !mr-4 transition-all duration-700 ${isZenMode ? 'opacity-0 translate-y-4' : 'opacity-100'}`}>
                        <button
                            onClick={() => handleMenuAction('add_root')}
                            className="w-16 h-16 bg-teal-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-teal-700 active:scale-90 transition-all border-4 border-white"
                        >
                            <Plus className="w-8 h-8 stroke-[3px]" />
                        </button>
                    </Panel>
                )}

                <Controls
                    className={`bg-white border-slate-200 shadow-xl rounded-2xl overflow-hidden !left-4 !bottom-4 transition-all duration-700 ${isZenMode ? 'opacity-0 -translate-y-4' : 'opacity-100'}`}
                    showInteractive={false}
                    showFitView={false}
                />

                {!isMobile && (
                    <MiniMap
                        className={`bg-white border-2 border-slate-200 shadow-xl rounded-2xl overflow-hidden !bottom-4 !right-4 transition-all duration-700 ${isZenMode ? 'opacity-0 translate-y-4 translate-x-4' : 'opacity-100'}`}
                        nodeStrokeColor={(node) => node.data.highlighted ? '#b45309' : '#0f766e'}
                        nodeColor={(node) => node.data.highlighted ? '#f59e0b' : '#14b8a6'}
                        nodeBorderRadius={8}
                        maskColor="rgb(248, 250, 252, 0.6)"
                        pannable
                        zoomable
                    />
                )}

                <Background color="#cbd5e1" gap={16} />

                {menu && (
                    <div style={{ top: menu.top, left: menu.left }} className="absolute z-50 bg-white border border-slate-200 rounded-lg shadow-xl p-2 w-56 flex flex-col gap-1">
                        <div className="text-xs font-bold text-gray-500 px-2 py-1 uppercase border-b mb-1">Actions</div>
                        <button className="text-left px-2 py-1 hover:bg-gray-100 rounded text-sm" onClick={() => { setMenu(null); const node = nodes.find(n => n.id === menu.id); if (node && onNodeClick) onNodeClick(null, node); }}>Edit Person</button>
                        <div className="border-t my-1"></div>
                        <div className="text-xs font-bold text-gray-500 px-2 py-1 uppercase border-b mb-1">Add Relative</div>
                        <button className="text-left px-2 py-1 hover:bg-gray-100 rounded text-sm" onClick={() => handleMenuAction('add_parent', menu.id)}>Add Biological Parent</button>
                        <button className="text-left px-2 py-1 hover:bg-gray-100 rounded text-sm" onClick={() => handleMenuAction('add_adoptive_parent', menu.id)}>Add Adoptive Parent</button>
                        <button className="text-left px-2 py-1 hover:bg-gray-100 rounded text-sm" onClick={() => handleMenuAction('add_step_parent', menu.id)}>Add Step Parent</button>
                        <div className="border-t my-1"></div>
                        <button className="text-left px-2 py-1 hover:bg-gray-100 rounded text-sm" onClick={() => handleMenuAction('add_child', menu.id)}>Add Biological Child</button>
                        <button className="text-left px-2 py-1 hover:bg-gray-100 rounded text-sm" onClick={() => handleMenuAction('add_adoptive_child', menu.id)}>Add Adoptive Child</button>
                        <button className="text-left px-2 py-1 hover:bg-gray-100 rounded text-sm" onClick={() => handleMenuAction('add_step_child', menu.id)}>Add Step Child</button>
                        <div className="border-t my-1"></div>
                        <button className="text-left px-2 py-1 hover:bg-gray-100 rounded text-sm" onClick={() => handleMenuAction('add_spouse', menu.id)}>Add Spouse/Partner</button>
                        <div className="border-t my-1"></div>
                        <button className="text-left px-2 py-1 hover:bg-red-50 text-red-600 rounded text-sm" onClick={() => handleMenuAction('delete', menu.id)}>Delete Person</button>
                    </div>
                )}
            </ReactFlow>

            {loading && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-50">
                    <LoadingSpinner size="lg" message="Loading family tree..." />
                </div>
            )}

            {error && (
                <div className="absolute inset-0 bg-white flex items-center justify-center z-50">
                    <ErrorMessage message="Failed to Load Tree" details={error} onRetry={fetchTreeData} />
                </div>
            )}

            {showEmptyState && (
                <div className="absolute inset-0 flex flex-col items-center justify-center z-50 pointer-events-none bg-black/5">
                    <div className="bg-white p-8 rounded-xl shadow-xl text-center pointer-events-auto max-w-md border border-gray-100">
                        <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <TreePine className="w-8 h-8 text-teal-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">Start Your Family Tree</h3>
                        <p className="text-gray-600 mb-6">This tree is currently empty. Add the first person to get started!</p>
                        <button onClick={() => handleMenuAction('add_root', null)} className="px-6 py-3 bg-teal-600 text-white rounded-lg shadow hover:bg-teal-700 transition font-semibold flex items-center justify-center gap-2 w-full">
                            <Plus className="w-5 h-5" />
                            Add First Person
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

// Wrap with ReactFlowProvider
const TreeVisualizer = (props) => (
    <ReactFlowProvider>
        <TreeVisualizerContent {...props} />
    </ReactFlowProvider>
);

export default TreeVisualizer;
