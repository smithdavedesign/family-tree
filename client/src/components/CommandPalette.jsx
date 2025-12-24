import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users, BookOpen, Image as ImageIcon, MapPin, X, Command, Loader2, ArrowRight } from 'lucide-react';
import { api } from '../auth';
import { Modal, Input } from './ui';

const CommandPalette = ({ isOpen, onClose }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const navigate = useNavigate();
    const inputRef = useRef(null);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (query.trim().length < 2) {
                setResults([]);
                return;
            }

            setLoading(true);
            try {
                const { data } = await api.get(`/search?q=${encodeURIComponent(query)}`);
                setResults(data.results || []);
                setSelectedIndex(0);
            } catch (error) {
                console.error('Search failed:', error);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    // Keyboard navigation
    const handleKeyDown = useCallback((e) => {
        const totalItems = query.length >= 2 ? results.length + 1 : results.length;
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev + 1) % Math.max(totalItems, 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev - 1 + totalItems) % Math.max(totalItems, 1));
        } else if (e.key === 'Enter') {
            if (selectedIndex === results.length) {
                onClose();
                navigate(`/search?q=${encodeURIComponent(query)}`);
            } else if (results[selectedIndex]) {
                handleSelect(results[selectedIndex]);
            }
        } else if (e.key === 'Escape') {
            onClose();
        }
    }, [results, selectedIndex, onClose]);

    const handleSelect = (result) => {
        onClose();
        setQuery('');

        const paths = {
            person: `/tree/${result.tree_id}?personId=${result.id}`,
            story: `/story/${result.id}`,
            album: `/album/${result.id}`,
            location: `/map?locationId=${result.id}`
        };

        navigate(paths[result.type] || '/');
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'person': return <Users className="w-4 h-4 text-blue-500" />;
            case 'story': return <BookOpen className="w-4 h-4 text-emerald-500" />;
            case 'album': return <ImageIcon className="w-4 h-4 text-purple-500" />;
            case 'location': return <MapPin className="w-4 h-4 text-orange-500" />;
            default: return <Search className="w-4 h-4 text-slate-400" />;
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto p-4 pt-[10vh] sm:p-6 sm:pt-[15vh]">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Palette Container */}
            <div
                className="relative mx-auto max-w-2xl transform divide-y divide-slate-100 overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-900/5 transition-all"
                onKeyDown={handleKeyDown}
            >
                <div className="relative">
                    <Search className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                    <input
                        ref={inputRef}
                        type="text"
                        className="h-12 w-full border-0 bg-transparent pl-11 pr-4 text-slate-900 placeholder:text-slate-400 focus:ring-0 sm:text-sm outline-none"
                        placeholder="Search for family, stories, places..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        autoFocus
                    />
                    {loading && (
                        <div className="absolute right-4 top-3.5">
                            <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                        </div>
                    )}
                </div>

                {/* Results Section */}
                {(results.length > 0 || query.length >= 2) && (
                    <div className="max-h-[60vh] overflow-y-auto p-2 text-sm text-slate-700">
                        <ul className="space-y-1">
                            {results.map((result, index) => (
                                <li
                                    key={`${result.type}-${result.id}`}
                                    className={`group flex cursor-default select-none items-center rounded-lg px-3 py-2.5 ${index === selectedIndex ? 'bg-slate-100 text-slate-900' : ''
                                        }`}
                                    onMouseEnter={() => setSelectedIndex(index)}
                                    onClick={() => handleSelect(result)}
                                >
                                    <div className={`flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-slate-900/5 ${index === selectedIndex ? 'ring-slate-900/10' : ''
                                        }`}>
                                        {getTypeIcon(result.type)}
                                    </div>
                                    <div className="ml-4 flex-auto">
                                        <p className="text-sm font-medium">{result.title}</p>
                                        <p className="text-xs text-slate-500 line-clamp-1">{result.subtitle}</p>
                                    </div>
                                    {index === selectedIndex && (
                                        <ArrowRight className="ml-3 h-4 w-4 flex-none text-slate-400" />
                                    )}
                                </li>
                            ))}

                            {/* "See all results" option */}
                            {query.length >= 2 && (
                                <li
                                    key="see-all-results"
                                    className={`group flex cursor-default select-none items-center rounded-lg px-3 py-2.5 ${selectedIndex === results.length ? 'bg-slate-100 text-slate-900' : ''
                                        }`}
                                    onMouseEnter={() => setSelectedIndex(results.length)}
                                    onClick={() => {
                                        onClose();
                                        navigate(`/search?q=${encodeURIComponent(query)}`);
                                    }}
                                >
                                    <div className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-slate-50 group-hover:bg-teal-50">
                                        <Search className="w-4 h-4 text-slate-400 group-hover:text-teal-600" />
                                    </div>
                                    <div className="ml-4 flex-auto">
                                        <p className="text-sm font-medium">See all results for "{query}"</p>
                                        <p className="text-xs text-slate-500">Perform a deep search across all trees</p>
                                    </div>
                                    <kbd className="ml-auto hidden sm:block font-sans px-1.5 py-0.5 rounded border border-slate-200 bg-white text-[10px] text-slate-400">↵</kbd>
                                </li>
                            )}
                        </ul>

                        {results.length === 0 && query.length >= 2 && !loading && (
                            <div className="px-6 py-14 text-center sm:px-14">
                                <Search className="mx-auto h-6 w-6 text-slate-400" />
                                <p className="mt-4 text-sm text-slate-900">No instant matches found</p>
                                <p className="mt-2 text-sm text-slate-500 italic">Press Enter to perform a deep discovery search</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Footer / Shortcuts */}
                <div className="flex items-center justify-between bg-slate-50 px-4 py-2.5 text-xs text-slate-500">
                    <div className="flex gap-4">
                        <span className="flex items-center gap-1">
                            <kbd className="font-sans px-1.5 py-0.5 rounded border border-slate-200 bg-white shadow-sm">Enter</kbd> to select
                        </span>
                        <span className="flex items-center gap-1">
                            <kbd className="font-sans px-1.5 py-0.5 rounded border border-slate-200 bg-white shadow-sm">↑↓</kbd> to navigate
                        </span>
                    </div>
                    <span className="flex items-center gap-1">
                        <kbd className="font-sans px-1.5 py-0.5 rounded border border-slate-200 bg-white shadow-sm">Esc</kbd> to close
                    </span>
                </div>
            </div>
        </div>
    );
};

export default CommandPalette;
