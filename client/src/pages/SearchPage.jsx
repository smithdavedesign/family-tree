import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, Filter, Calendar, Users, BookOpen, Image as ImageIcon, MapPin, ChevronRight, SlidersHorizontal, X, ArrowLeft, Loader2 } from 'lucide-react';
import { api } from '../auth';
import Navbar from '../components/Navbar';
import { Button, Input } from '../components/ui';

const SearchPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();

    // State from URL
    const query = searchParams.get('q') || '';
    const treeId = searchParams.get('treeId') || '';
    const type = searchParams.get('type') || '';

    // Local state
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [trees, setTrees] = useState([]);
    const [showFilters, setShowFilters] = useState(true);
    const [localQuery, setLocalQuery] = useState(query);

    // Filter state
    const [filters, setFilters] = useState({
        treeId: treeId,
        type: type,
        era: 'all' // all, 1800s, 1900s, 2000s, custom
    });

    useEffect(() => {
        fetchTrees();
    }, []);

    useEffect(() => {
        if (query) {
            performSearch();
        }
    }, [query, treeId, type]);

    const fetchTrees = async () => {
        try {
            const { data } = await api.get('/trees');
            const allTrees = Array.isArray(data) ? data : [...(data.ownedTrees || []), ...(data.sharedTrees || [])];
            setTrees(allTrees);
        } catch (error) {
            console.error('Failed to fetch trees:', error);
        }
    };

    const performSearch = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (query) params.append('q', query);
            if (treeId) params.append('treeId', treeId);
            if (type) params.append('type', type);

            const { data } = await api.get(`/search?${params.toString()}`);
            setResults(data.results || []);
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        const newParams = new URLSearchParams(searchParams);
        if (localQuery) newParams.set('q', localQuery);
        else newParams.delete('q');
        setSearchParams(newParams);
    };

    const updateFilter = (key, value) => {
        const newParams = new URLSearchParams(searchParams);
        if (value) newParams.set(key, value);
        else newParams.delete(key);
        setSearchParams(newParams);
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'person': return <Users className="w-5 h-5 text-blue-500" />;
            case 'story': return <BookOpen className="w-5 h-5 text-emerald-500" />;
            case 'album': return <ImageIcon className="w-5 h-5 text-purple-500" />;
            case 'location': return <MapPin className="w-5 h-5 text-orange-500" />;
            default: return <Search className="w-5 h-5 text-slate-400" />;
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar title="Discovery" />

            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Search Bar Area */}
                <div className="mb-8">
                    <form onSubmit={handleSearchSubmit} className="flex gap-3 max-w-2xl">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                value={localQuery}
                                onChange={(e) => setLocalQuery(e.target.value)}
                                placeholder="Search people, stories, albums..."
                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                            />
                        </div>
                        <Button type="submit" variant="primary">
                            Search
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setShowFilters(!showFilters)}
                            className={showFilters ? 'bg-slate-100' : ''}
                        >
                            <SlidersHorizontal className="w-5 h-5" />
                        </Button>
                    </form>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Filters Sidebar */}
                    {showFilters && (
                        <aside className="w-full lg:w-64 shrink-0 space-y-6 animate-fadeIn">
                            {/* Categories */}
                            <div>
                                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Category</h3>
                                <div className="space-y-1">
                                    {[
                                        { id: '', label: 'All Results', icon: <Search className="w-4 h-4" /> },
                                        { id: 'person', label: 'People', icon: <Users className="w-4 h-4" /> },
                                        { id: 'story', label: 'Stories', icon: <BookOpen className="w-4 h-4" /> },
                                        { id: 'album', label: 'Albums', icon: <ImageIcon className="w-4 h-4" /> },
                                        { id: 'location', label: 'Locations', icon: <MapPin className="w-4 h-4" /> },
                                    ].map(cat => (
                                        <button
                                            key={cat.id}
                                            onClick={() => updateFilter('type', cat.id)}
                                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${type === cat.id ? 'bg-teal-50 text-teal-700 font-medium' : 'text-slate-600 hover:bg-slate-100'
                                                }`}
                                        >
                                            {cat.icon}
                                            {cat.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Trees */}
                            <div>
                                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Family Tree</h3>
                                <select
                                    value={treeId}
                                    onChange={(e) => updateFilter('treeId', e.target.value)}
                                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-500"
                                >
                                    <option value="">All Trees</option>
                                    {trees.map(tree => (
                                        <option key={tree.id} value={tree.id}>{tree.name}</option>
                                    ))}
                                </select>
                            </div>
                        </aside>
                    )}

                    {/* Results Area */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-slate-900">
                                {loading ? 'Searching...' : `${results.length} Results found`}
                            </h2>
                        </div>

                        {loading ? (
                            <div className="grid gap-4">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 animate-pulse">
                                        <div className="flex gap-4">
                                            <div className="w-12 h-12 bg-slate-100 rounded-xl" />
                                            <div className="flex-1 space-y-2">
                                                <div className="h-4 bg-slate-100 rounded w-1/4" />
                                                <div className="h-3 bg-slate-100 rounded w-1/2" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : results.length > 0 ? (
                            <div className="grid gap-4 pb-12">
                                {results.map((result) => (
                                    <div
                                        key={`${result.type}-${result.id}`}
                                        onClick={() => {
                                            const paths = {
                                                person: `/tree/${result.tree_id}?personId=${result.id}`,
                                                story: `/story/${result.id}`,
                                                album: `/album/${result.id}`,
                                                location: `/map?locationId=${result.id}`
                                            };
                                            navigate(paths[result.type] || '/');
                                        }}
                                        className="group bg-white p-6 rounded-2xl border border-slate-200 hover:border-teal-300 hover:shadow-lg hover:shadow-teal-500/5 transition-all cursor-pointer"
                                    >
                                        <div className="flex gap-5">
                                            <div className="shrink-0 flex items-center justify-center w-14 h-14 bg-slate-50 rounded-2xl group-hover:bg-teal-50 transition-colors">
                                                {result.image ? (
                                                    <img src={result.image} alt="" className="w-full h-full object-cover rounded-2xl" />
                                                ) : getTypeIcon(result.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-teal-700 transition-colors truncate">
                                                        {result.title}
                                                    </h3>
                                                    <span className="px-2 py-0.5 bg-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-500 rounded-md">
                                                        {result.type}
                                                    </span>
                                                </div>
                                                <p className="text-sm font-medium text-slate-500 mb-2">{result.subtitle}</p>
                                                <p className="text-sm text-slate-600 line-clamp-2 italic">
                                                    {result.description || "No description available."}
                                                </p>
                                            </div>
                                            <div className="shrink-0 self-center">
                                                <div className="p-2 rounded-full bg-slate-50 group-hover:bg-teal-600 group-hover:text-white transition-all transform group-hover:translate-x-1">
                                                    <ChevronRight className="w-5 h-5" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : query ? (
                            <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                                <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-slate-900 mb-2">No matches found</h3>
                                <p className="text-slate-500 max-w-sm mx-auto">
                                    We couldn't find anything matching "{query}". Try checking your spelling or using fewer keywords.
                                </p>
                                <Button
                                    variant="ghost"
                                    className="mt-6"
                                    onClick={() => {
                                        setLocalQuery('');
                                        setSearchParams({});
                                    }}
                                >
                                    Clear all filters
                                </Button>
                            </div>
                        ) : (
                            <div className="text-center py-20">
                                <Search className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-slate-400">Start searching to discover your history</h3>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SearchPage;
