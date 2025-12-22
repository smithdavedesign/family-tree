import React, { useState } from 'react';
import { Search, X, Calendar, Filter } from 'lucide-react';

const SearchBar = ({ persons = [], onHighlight, onClear, onClose }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all'); // 'all', 'name', 'year', 'branch'
    const [showFilters, setShowFilters] = useState(false);
    const [yearRange, setYearRange] = useState({ start: '', end: '' });

    const handleSearch = (term) => {
        setSearchTerm(term);

        if (!term.trim()) {
            onClear();
            return;
        }

        const results = persons.filter(person => {
            const fullName = `${person.first_name} ${person.last_name || ''}`.toLowerCase();
            const searchLower = term.toLowerCase();

            switch (filterType) {
                case 'name':
                    return fullName.includes(searchLower);

                case 'year':
                    if (!yearRange.start && !yearRange.end) return fullName.includes(searchLower);
                    const birthYear = person.dob ? new Date(person.dob).getFullYear() : null;
                    const deathYear = person.dod ? new Date(person.dod).getFullYear() : null;

                    // Extract years from date inputs (format: YYYY-MM-DD)
                    const startYear = yearRange.start ? parseInt(yearRange.start.split('-')[0]) : -Infinity;
                    const endYear = yearRange.end ? parseInt(yearRange.end.split('-')[0]) : Infinity;

                    return (birthYear && birthYear >= startYear && birthYear <= endYear) ||
                        (deathYear && deathYear >= startYear && deathYear <= endYear);

                case 'all':
                default:
                    return fullName.includes(searchLower) ||
                        person.occupation?.toLowerCase().includes(searchLower) ||
                        person.pob?.toLowerCase().includes(searchLower);
            }
        });

        onHighlight(results.map(p => p.id));
    };

    const handleClear = () => {
        setSearchTerm('');
        setYearRange({ start: '', end: '' });
        onClear();
    };

    return (
        <div className="bg-white border rounded-xl shadow-lg p-3 z-30">
            <div className="max-w-4xl mx-auto">
                <div className="flex gap-2 items-center">
                    {/* Search Input */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => handleSearch(e.target.value)}
                            placeholder="Search family members..."
                            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            autoFocus
                        />
                        {searchTerm && (
                            <button
                                onClick={handleClear}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {/* Filter Toggle */}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`p-2 rounded-lg border transition ${showFilters ? 'bg-teal-50 border-teal-500 text-teal-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                            }`}
                        title="Filters"
                    >
                        <Filter className="w-5 h-5" />
                    </button>

                    {/* Close Button */}
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50"
                            title="Close Search"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {/* Filter Options */}
                {showFilters && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex flex-wrap gap-2 mb-3">
                            <button
                                onClick={() => setFilterType('all')}
                                className={`px-3 py-1 rounded-full text-sm font-medium transition ${filterType === 'all' ? 'bg-teal-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
                                    }`}
                            >
                                All Fields
                            </button>
                            <button
                                onClick={() => setFilterType('name')}
                                className={`px-3 py-1 rounded-full text-sm font-medium transition ${filterType === 'name' ? 'bg-teal-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
                                    }`}
                            >
                                Name Only
                            </button>
                            <button
                                onClick={() => setFilterType('year')}
                                className={`px-3 py-1 rounded-full text-sm font-medium transition ${filterType === 'year' ? 'bg-teal-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
                                    }`}
                            >
                                Year Range
                            </button>
                        </div>

                        {/* Year Range Inputs */}
                        {filterType === 'year' && (
                            <div className="flex flex-wrap items-center gap-2">
                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                    <Calendar className="w-4 h-4 text-gray-500 shrink-0" />
                                    <input
                                        type="date"
                                        id="yearRangeStart"
                                        name="yearRangeStart"
                                        value={yearRange.start}
                                        onChange={(e) => {
                                            setYearRange({ ...yearRange, start: e.target.value });
                                            handleSearch(searchTerm);
                                        }}
                                        placeholder="Start date"
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 min-w-0"
                                    />
                                </div>
                                <span className="text-gray-500 mx-auto sm:mx-0 text-xs">to</span>
                                <input
                                    type="date"
                                    id="yearRangeEnd"
                                    name="yearRangeEnd"
                                    value={yearRange.end}
                                    onChange={(e) => {
                                        setYearRange({ ...yearRange, end: e.target.value });
                                        handleSearch(searchTerm);
                                    }}
                                    placeholder="End date"
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 min-w-0"
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SearchBar;
