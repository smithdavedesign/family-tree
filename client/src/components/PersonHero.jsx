import React from 'react';
import { User as UserIcon, MapPin, Briefcase, Calendar, Edit, Image as ImageIcon, BookOpen } from 'lucide-react';

const PersonHero = ({ person, isEditor, onEditPerson, onAddPhoto, onAddStory }) => {
    const fullName = `${person.first_name} ${person.middle_name || ''} ${person.last_name || ''}`.trim();

    // Calculate age or lifespan
    const calculateLifespan = () => {
        if (!person.dob) return null;

        const birthDate = new Date(person.dob);
        const birthYear = birthDate.getFullYear();

        if (person.dod) {
            const deathDate = new Date(person.dod);
            const deathYear = deathDate.getFullYear();
            const age = deathYear - birthYear;
            return { text: `${birthYear}–${deathYear}`, subtext: `Lived ${age} years` };
        }

        const age = new Date().getFullYear() - birthYear;
        return { text: `Born ${birthYear}`, subtext: `Age ${age}` };
    };

    const lifespan = calculateLifespan();

    return (
        <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="p-8 md:p-12">
                <div className="flex flex-col md:flex-row gap-8 items-start">
                    {/* Profile Photo */}
                    <div className="relative group">
                        <div className="w-40 h-40 rounded-2xl overflow-hidden bg-gradient-to-br from-teal-50 to-slate-100 flex-shrink-0 shadow-xl ring-4 ring-white">
                            {person.profile_photo_url ? (
                                <img
                                    src={person.profile_photo_url}
                                    alt={fullName}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <UserIcon className="w-full h-full p-10 text-slate-300" />
                            )}
                        </div>
                        {isEditor && (
                            <button
                                onClick={onAddPhoto}
                                className="absolute bottom-2 right-2 p-2 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-teal-50"
                                title="Change photo"
                            >
                                <ImageIcon className="w-4 h-4 text-teal-600" />
                            </button>
                        )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        {/* Name */}
                        <div className="mb-4">
                            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-2 leading-tight">
                                {fullName}
                            </h1>
                            {lifespan && (
                                <div className="flex items-baseline gap-3">
                                    <span className="text-xl font-semibold text-teal-600">{lifespan.text}</span>
                                    <span className="text-sm text-slate-500">{lifespan.subtext}</span>
                                </div>
                            )}
                        </div>

                        {/* Quick Tags */}
                        <div className="flex flex-wrap gap-3 mb-6">
                            {person.pob && (
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-slate-200 shadow-sm">
                                    <MapPin className="w-4 h-4 text-teal-600" />
                                    <div>
                                        <div className="text-xs text-slate-500">Birthplace</div>
                                        <div className="text-sm font-semibold text-slate-700">{person.pob}</div>
                                    </div>
                                </div>
                            )}
                            {person.place_of_death && person.dod && (
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-slate-200 shadow-sm">
                                    <MapPin className="w-4 h-4 text-slate-600" />
                                    <div>
                                        <div className="text-xs text-slate-500">Died</div>
                                        <div className="text-sm font-semi

bold text-slate-700">{person.place_of_death}</div>
                                    </div>
                                </div>
                            )}
                            {person.occupation && (
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-slate-200 shadow-sm">
                                    <Briefcase className="w-4 h-4 text-blue-600" />
                                    <div>
                                        <div className="text-xs text-slate-500">Occupation</div>
                                        <div className="text-sm font-semibold text-slate-700">{person.occupation}</div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Bio Snippet */}
                        {person.bio && (
                            <p className="text-slate-600 leading-relaxed line-clamp-3 mb-6">
                                {person.bio}
                            </p>
                        )}

                        {/* Action Buttons */}
                        {isEditor && (
                            <div className="flex flex-wrap gap-3">
                                <button
                                    onClick={onEditPerson}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-all shadow-md hover:shadow-lg font-medium"
                                >
                                    <Edit className="w-4 h-4" />
                                    Edit Person
                                </button>
                                <button
                                    onClick={onAddPhoto}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-slate-300 text-slate-700 rounded-xl hover:border-teal-300 hover:bg-teal-50 transition-all font-medium"
                                >
                                    <ImageIcon className="w-4 h-4" />
                                    Add Photo
                                </button>
                                <button
                                    onClick={onAddStory}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-slate-300 text-slate-700 rounded-xl hover:border-teal-300 hover:bg-teal-50 transition-all font-medium"
                                >
                                    <BookOpen className="w-4 h-4" />
                                    Add Story
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PersonHero;
