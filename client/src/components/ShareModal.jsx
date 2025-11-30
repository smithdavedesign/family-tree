import React, { useState, useEffect } from 'react';
import { X, Copy, Check, UserPlus, Users, Trash2, Shield } from 'lucide-react';
import { supabase } from '../auth';

const ShareModal = ({ isOpen, onClose, treeId, treeName, currentUserRole }) => {
    const [activeTab, setActiveTab] = useState('invite'); // 'invite' or 'members'
    const [inviteRole, setInviteRole] = useState('viewer');
    const [generatedLink, setGeneratedLink] = useState('');
    const [loading, setLoading] = useState(false);
    const [members, setMembers] = useState([]);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (isOpen && activeTab === 'members') {
            fetchMembers();
        }
    }, [isOpen, activeTab]);

    const fetchMembers = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            const response = await fetch(`/api/tree/${treeId}/members`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
                const { members } = await response.json();
                setMembers(members);
            }
        } catch (error) {
            console.error("Error fetching members:", error);
        }
    };

    const handleCreateInvite = async () => {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            const response = await fetch(`/api/tree/${treeId}/invite`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ role: inviteRole })
            });

            if (response.ok) {
                const data = await response.json();
                setGeneratedLink(`${window.location.origin}${data.link}`);
            }
        } catch (error) {
            console.error("Error creating invite:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(generatedLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleRemoveMember = async (userId) => {
        if (!confirm('Are you sure you want to remove this member?')) return;

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            const response = await fetch(`/api/tree/${treeId}/member/${userId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
                fetchMembers(); // Refresh list
            }
        } catch (error) {
            console.error("Error removing member:", error);
        }
    };

    const handleUpdateRole = async (userId, newRole) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            const response = await fetch(`/api/tree/${treeId}/member/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ role: newRole })
            });

            if (response.ok) {
                fetchMembers(); // Refresh list
            }
        } catch (error) {
            console.error("Error updating role:", error);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70]">
            <div className="bg-white rounded-lg w-[500px] max-h-[80vh] flex flex-col shadow-xl">
                {/* Header */}
                <div className="p-4 border-b flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-800">Share "{treeName}"</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b">
                    <button
                        onClick={() => setActiveTab('invite')}
                        className={`flex-1 py-3 text-sm font-medium ${activeTab === 'invite'
                                ? 'text-teal-600 border-b-2 border-teal-600'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <UserPlus className="w-4 h-4" />
                            Invite People
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveTab('members')}
                        className={`flex-1 py-3 text-sm font-medium ${activeTab === 'members'
                                ? 'text-teal-600 border-b-2 border-teal-600'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <Users className="w-4 h-4" />
                            Manage Members
                        </div>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 flex-1 overflow-y-auto">
                    {activeTab === 'invite' ? (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Permission Level
                                </label>
                                <div className="flex gap-4">
                                    <label className={`flex-1 p-3 border rounded-lg cursor-pointer transition ${inviteRole === 'viewer' ? 'border-teal-500 bg-teal-50' : 'hover:bg-gray-50'}`}>
                                        <input
                                            type="radio"
                                            name="role"
                                            value="viewer"
                                            checked={inviteRole === 'viewer'}
                                            onChange={(e) => setInviteRole(e.target.value)}
                                            className="sr-only"
                                        />
                                        <div className="font-medium text-gray-900">Viewer</div>
                                        <div className="text-xs text-gray-500">Can view tree and details</div>
                                    </label>
                                    <label className={`flex-1 p-3 border rounded-lg cursor-pointer transition ${inviteRole === 'editor' ? 'border-teal-500 bg-teal-50' : 'hover:bg-gray-50'}`}>
                                        <input
                                            type="radio"
                                            name="role"
                                            value="editor"
                                            checked={inviteRole === 'editor'}
                                            onChange={(e) => setInviteRole(e.target.value)}
                                            className="sr-only"
                                        />
                                        <div className="font-medium text-gray-900">Editor</div>
                                        <div className="text-xs text-gray-500">Can add/edit people & photos</div>
                                    </label>
                                </div>
                            </div>

                            {!generatedLink ? (
                                <button
                                    onClick={handleCreateInvite}
                                    disabled={loading}
                                    className="w-full py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition font-medium disabled:opacity-50"
                                >
                                    {loading ? 'Generating Link...' : 'Generate Invite Link'}
                                </button>
                            ) : (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Share this link
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            readOnly
                                            value={generatedLink}
                                            className="flex-1 p-2 border rounded-lg bg-gray-50 text-sm"
                                        />
                                        <button
                                            onClick={handleCopyLink}
                                            className="p-2 border rounded-lg hover:bg-gray-50 text-gray-600"
                                            title="Copy to clipboard"
                                        >
                                            {copied ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5" />}
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">
                                        Anyone with this link can join as a {inviteRole}. Link expires in 7 days.
                                    </p>
                                    <button
                                        onClick={() => setGeneratedLink('')}
                                        className="text-sm text-teal-600 hover:underline mt-4"
                                    >
                                        Generate a new link
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {members.map((member) => (
                                <div key={member.users.id} className="flex items-center justify-between p-3 border rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center text-teal-700 font-bold">
                                            {member.users.email[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="font-medium text-gray-900">
                                                {member.users.user_metadata?.full_name || member.users.email}
                                            </div>
                                            <div className="text-xs text-gray-500 capitalize">
                                                {member.role}
                                            </div>
                                        </div>
                                    </div>

                                    {currentUserRole === 'owner' && member.role !== 'owner' && (
                                        <div className="flex items-center gap-2">
                                            <select
                                                value={member.role}
                                                onChange={(e) => handleUpdateRole(member.users.id, e.target.value)}
                                                className="text-sm border rounded p-1"
                                            >
                                                <option value="viewer">Viewer</option>
                                                <option value="editor">Editor</option>
                                            </select>
                                            <button
                                                onClick={() => handleRemoveMember(member.users.id)}
                                                className="p-1 text-red-500 hover:bg-red-50 rounded"
                                                title="Remove member"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                    {member.role === 'owner' && (
                                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full font-medium flex items-center gap-1">
                                            <Shield className="w-3 h-3" /> Owner
                                        </span>
                                    )}
                                </div>
                            ))}
                            {members.length === 0 && (
                                <div className="text-center text-gray-500 py-8">
                                    Loading members...
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ShareModal;
