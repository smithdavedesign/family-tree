import React, { useState, useEffect } from 'react';
import { Copy, Check, UserPlus, Users, Trash2, Shield } from 'lucide-react';
import { supabase } from '../auth';
import { Modal, Button, Input, Select, useToast } from './ui';

const ShareModal = ({ isOpen, onClose, treeId, treeName, currentUserRole }) => {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState('invite'); // 'invite' or 'members'
    const [inviteRole, setInviteRole] = useState('viewer');
    const [inviteEmail, setInviteEmail] = useState('');
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
            toast.error("Failed to load members");
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
                body: JSON.stringify({
                    role: inviteRole,
                    email: inviteEmail || undefined
                })
            });

            if (response.ok) {
                const data = await response.json();
                setGeneratedLink(`${window.location.origin}${data.link}`);
                if (inviteEmail) {
                    toast.success("Invite sent to email!");
                    setInviteEmail(''); // Clear email after sending
                } else {
                    toast.success("Invite link generated");
                }
            } else {
                toast.error("Failed to generate invite link");
            }
        } catch (error) {
            console.error("Error creating invite:", error);
            toast.error("Error creating invite");
        } finally {
            setLoading(false);
        }
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(generatedLink);
        setCopied(true);
        toast.success("Link copied to clipboard");
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
                toast.success("Member removed");
                fetchMembers(); // Refresh list
            } else {
                toast.error("Failed to remove member");
            }
        } catch (error) {
            console.error("Error removing member:", error);
            toast.error("Error removing member");
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
                toast.success("Role updated");
                fetchMembers(); // Refresh list
            } else {
                toast.error("Failed to update role");
            }
        } catch (error) {
            console.error("Error updating role:", error);
            toast.error("Error updating role");
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Share "${treeName}"`}
            size="md"
        >
            {/* Tabs */}
            <div className="flex border-b mb-6">
                <button
                    onClick={() => setActiveTab('invite')}
                    className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'invite'
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
                    className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'members'
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
            <div className="min-h-[300px]">
                {activeTab === 'invite' ? (
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Permission Level
                            </label>
                            <div className="flex gap-4">
                                <label className={`flex-1 p-3 border-2 rounded-lg cursor-pointer transition relative ${inviteRole === 'viewer' ? 'border-teal-600 bg-teal-50 ring-2 ring-teal-200' : 'border-gray-200 hover:bg-gray-50'}`}>
                                    <input
                                        type="radio"
                                        name="role"
                                        value="viewer"
                                        checked={inviteRole === 'viewer'}
                                        onChange={(e) => setInviteRole(e.target.value)}
                                        className="sr-only"
                                    />
                                    <div className="flex items-center justify-between">
                                        <div className="font-medium text-gray-900">Viewer</div>
                                        {inviteRole === 'viewer' && <Check className="w-5 h-5 text-teal-600" />}
                                    </div>
                                    <div className="text-xs text-gray-500">Can view tree and details</div>
                                </label>
                                <label className={`flex-1 p-3 border-2 rounded-lg cursor-pointer transition relative ${inviteRole === 'editor' ? 'border-teal-600 bg-teal-50 ring-2 ring-teal-200' : 'border-gray-200 hover:bg-gray-50'}`}>
                                    <input
                                        type="radio"
                                        name="role"
                                        value="editor"
                                        checked={inviteRole === 'editor'}
                                        onChange={(e) => setInviteRole(e.target.value)}
                                        className="sr-only"
                                    />
                                    <div className="flex items-center justify-between">
                                        <div className="font-medium text-gray-900">Editor</div>
                                        {inviteRole === 'editor' && <Check className="w-5 h-5 text-teal-600" />}
                                    </div>
                                    <div className="text-xs text-gray-500">Can add/edit people & photos</div>
                                </label>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Invite by Email (Optional)
                            </label>
                            <Input
                                type="email"
                                placeholder="Enter email address..."
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                We'll send them a magic link to join directly. Leave blank to just generate a link.
                            </p>
                        </div>

                        {!generatedLink ? (
                            <Button
                                onClick={handleCreateInvite}
                                disabled={loading}
                                loading={loading}
                                fullWidth
                                variant="primary"
                            >
                                {inviteEmail ? 'Send Invite' : 'Generate Invite Link'}
                            </Button>
                        ) : (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Share this link
                                </label>
                                <div className="flex gap-2">
                                    <Input
                                        readOnly
                                        value={generatedLink}
                                        className="flex-1"
                                    />
                                    <Button
                                        onClick={handleCopyLink}
                                        variant="outline"
                                        title="Copy to clipboard"
                                        className="px-3"
                                    >
                                        {copied ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5" />}
                                    </Button>
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                    Anyone with this link can join as a {inviteRole}. Link expires in 7 days.
                                </p>
                                <button
                                    onClick={() => setGeneratedLink('')}
                                    className="text-sm text-teal-600 hover:underline mt-4 font-medium"
                                >
                                    Generate a new link
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {members.map((member) => (
                            <div key={member.users.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center text-teal-700 font-bold">
                                        {member.users.email[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="font-medium text-gray-900">
                                            {member.users.email}
                                        </div>
                                        <div className="text-xs text-gray-500 capitalize">
                                            {member.role}
                                        </div>
                                    </div>
                                </div>

                                {currentUserRole === 'owner' && member.role !== 'owner' && (
                                    <div className="flex items-center gap-2">
                                        <Select
                                            value={member.role}
                                            onChange={(val) => handleUpdateRole(member.users.id, val)}
                                            options={[
                                                { value: 'viewer', label: 'Viewer' },
                                                { value: 'editor', label: 'Editor' }
                                            ]}
                                            className="!w-32"
                                        />
                                        <Button
                                            variant="danger"
                                            size="xs"
                                            onClick={() => handleRemoveMember(member.users.id)}
                                            title="Remove member"
                                            className="p-1.5"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
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
        </Modal>
    );
};

export default ShareModal;
