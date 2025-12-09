import React from 'react';
import { Users, Heart, Baby, User as UserIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

const RelationshipMap = ({ person, relationships, allPersons, treeId }) => {
    // Helper to find person by ID
    const findPerson = (id) => allPersons.find(p => p.id === id);

    // Debug logging
    console.log('RelationshipMap Debug:', {
        personId: person.id,
        relationshipsCount: relationships?.length || 0,
        allPersonsCount: allPersons?.length || 0,
        relationships: relationships
    });

    // Extract different relationship types
    const parents = [];
    const spouses = [];
    const children = [];
    const siblings = [];

    if (!relationships || !Array.isArray(relationships)) {
        console.warn('No relationships array provided');
        return null;
    }

    relationships.forEach(rel => {
        const isP1 = rel.person_1_id === person.id;
        const otherId = isP1 ? rel.person_2_id : rel.person_1_id;
        const otherPerson = findPerson(otherId);

        if (!otherPerson) {
            console.warn(`Could not find person with id: ${otherId}`);
            return;
        }

        // Categorize based on relationship_type
        const relType = rel.relationship_type?.toLowerCase() || '';

        if (relType.includes('parent') && relType.includes('child')) {
            // parent_child: person_1 is parent, person_2 is child
            if (rel.person_1_id === person.id) {
                children.push({ ...otherPerson, relationship: rel });
            } else {
                parents.push({ ...otherPerson, relationship: rel });
            }
        } else if (relType === 'spouse' || relType === 'partner') {
            spouses.push({ ...otherPerson, relationship: rel });
        } else if (relType === 'sibling') {
            siblings.push({ ...otherPerson, relationship: rel });
        }
    });

    const PersonCard = ({ person: p, relationshipLabel }) => {
        const fullName = `${p.first_name} ${p.last_name || ''}`.trim();
        const lifespan = p.dob ? (p.dod ?
            `${new Date(p.dob).getFullYear()}–${new Date(p.dod).getFullYear()}` :
            `b. ${new Date(p.dob).getFullYear()}`
        ) : null;

        return (
            <Link
                to={`/tree/${treeId}/person/${p.id}`}
                className="group bg-white rounded-xl p-4 border-2 border-slate-200 hover:border-teal-300 hover:shadow-lg transition-all"
            >
                <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-full overflow-hidden bg-slate-100 flex-shrink-0 ring-2 ring-white">
                        {p.profile_photo_url ? (
                            <img src={p.profile_photo_url} alt={fullName} className="w-full h-full object-cover" />
                        ) : (
                            <UserIcon className="w-full h-full p-3 text-slate-300" />
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        {label && (
                            <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-0.5">
                                {label}
                            </div>
                        )}
                        <div className="font-semibold text-slate-900 group-hover:text-teal-600 transition-colors truncate">
                            {fullName}
                        </div>
                        {lifespan && (
                            <div className="text-xs text-slate-500">{lifespan}</div>
                        )}
                    </div>
                </div>
            </Link>
        );
    };

    const hasRelationships = parents.length > 0 || spouses.length > 0 || children.length > 0 || siblings.length > 0;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                <Users className="w-6 h-6 text-teal-600" />
                Family Connections
            </h2>

            {!hasRelationships ? (
                <div className="text-center py-12">
                    <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">No family connections recorded yet</p>
                </div>
            ) : (
                <div className="space-y-8">
                    {/* Parents */}
                    {parents.length > 0 && (
                        <div>
                            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4 flex items-center gap-2">
                                <UserIcon className="w-4 h-4 text-blue-600" />
                                Parents
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {parents.map(p => (
                                    <PersonCard key={p.id} person={p} iconColor="blue" />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Spouses */}
                    {spouses.length > 0 && (
                        <div>
                            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4 flex items-center gap-2">
                                <Heart className="w-4 h-4 text-red-500" />
                                {spouses.length === 1 ? 'Spouse' : 'Spouses'}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {spouses.map(p => (
                                    <PersonCard key={p.id} person={p} iconColor="red" />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Siblings */}
                    {siblings.length > 0 && (
                        <div>
                            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4 flex items-center gap-2">
                                <Users className="w-4 h-4 text-purple-600" />
                                Siblings
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {siblings.map(p => (
                                    <PersonCard key={p.id} person={p} iconColor="purple" />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Children */}
                    {children.length > 0 && (
                        <div>
                            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4 flex items-center gap-2">
                                <Baby className="w-4 h-4 text-teal-600" />
                                Children
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {children.map(p => (
                                    <PersonCard key={p.id} person={p} iconColor="teal" />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default RelationshipMap;
