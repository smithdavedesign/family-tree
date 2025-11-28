import React, { useState } from 'react';
import { Search, X, Filter } from 'lucide-react';

const SearchBar = ({ persons, onHighlight, onClear }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [yearFrom, setYearFrom] = useState('');
    const [yearTo, setYearTo] = useState('');
    const [filterType, setFilterType] = useState('all'); // 'all', 'birth', 'death'

    const handleSearch = () => {
        if (!searchQuery && !yearFrom && !yearTo) {
            onClear();
            return;
        }

        const matches = persons.filter(person => {
            // Name search
            const fullName = `${person.first_name} ${person.last_name || ''}`.toLowerCase();
            const nameMatch = !searchQuery || fullName.includes(searchQuery.toLowerCase());

            // Year filter
            let yearMatch = true;
            if (yearFrom || yearTo) {
                const birthYear = person.dob ? new Date(person.dob).getFullYear() : null;
                const deathYear = person.dod ? new Date(person.dod).getFullYear() : null;

                if (filterType === 'birth' && birthYear) {
                    yearMatch = (!yearFrom || birthYear >= parseInt(yearFrom)) &&
                        (!yearTo || birthYear <= parseInt(yearTo));
                } else if (filterType === 'death' && deathYear) {
                    yearMatch = (!yearFrom || deathYear >= parseInt(yearFrom)) &&
                        (!yearTo || deathYear <= parseInt(yearTo));
                } else if (filterType === 'all') {
                    const birthInRange = birthYear &&
                        (!yearFrom || birthYear >= parseInt(yearFrom)) &&
                        (!yearTo || birthYear <= parseInt(yearTo));
                    const deathInRange = deathYear &&
                        (!yearFrom || deathYear >= parseInt(yearFrom)) &&
                        (!yearTo || deathYear <= parseInt(yearTo));
                    yearMatch = birthInRange || deathInRange;
                }
            }

            return nameMatch && yearMatch;
        });

        onHighlight(matches.map(p => p.id));
    };

    const handleClear = () => {
        setSearchQuery('');
        setYearFrom('');
        setYearTo('');
        setFilterType('all');
        onClear();
    };

    return (
        <div className="bg-white border-b border-slate-200 shadow-sm z-30 relative">
            <div className="p-3 flex gap-2 max-w-4xl mx-auto">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all text-sm md:text-base placeholder-slate-400 text-slate-800"
                    />
                </div>
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`px-3 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-colors text-slate-600 ${showFilters ? 'bg-slate-100 border-slate-300 text-teal-600' : ''}`}
                    title="Filters"
                >
                    <Filter className="w-5 h-5" />
                </button>
                <button
                    onClick={handleSearch}
                    className="px-3 md:px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 shadow-sm hover:shadow transition-all text-sm md:text-base font-medium"
                >
                    <span className="hidden md:inline">Search</span>
                    <Search className="w-5 h-5 md:hidden" />
                </button>
                {(searchQuery || yearFrom || yearTo) && (
                    <button
                        onClick={handleClear}
                        className="px-3 py-2 border border-slate-200 rounded-lg hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors text-slate-500"
                        title="Clear"
                    >
                        <X className="w-5 h-5" />
                    </button>
                )}
            </div>

            {showFilters && (
                <div className="px-3 pb-4 border-t border-slate-100 bg-slate-50/50 backdrop-blur-sm">
                    <div className="pt-4 space-y-4 max-w-4xl mx-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Filter by Year</label>
                                <div className="flex gap-2 items-center">
                                    <input
                                        type="number"
                                        placeholder="From"
                                        value={yearFrom}
                                        onChange={(e) => setYearFrom(e.target.value)}
                                        className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                                    />
                                    <span className="text-slate-400 font-medium text-sm">to</span>
                                    <input
                                        type="number"
                                        placeholder="To"
                                        value={yearTo}
                                        onChange={(e) => setYearTo(e.target.value)}
                                        className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Year Type</label>
                                <select
                                    value={filterType}
                                    onChange={(e) => setFilterType(e.target.value)}
                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm text-slate-700"
                                >
                                    <option value="all">Birth or Death</option>
                                    <option value="birth">Birth Year Only</option>
                                    <option value="death">Death Year Only</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SearchBar;
