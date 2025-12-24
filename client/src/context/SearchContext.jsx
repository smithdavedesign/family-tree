import React, { createContext, useContext, useState, useEffect } from 'react';
import CommandPalette from '../components/CommandPalette';

const SearchContext = createContext({
    isOpen: false,
    openSearch: () => { },
    closeSearch: () => { },
    toggleSearch: () => { }
});

export const useSearch = () => useContext(SearchContext);

export const SearchProvider = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);

    const openSearch = () => setIsOpen(true);
    const closeSearch = () => setIsOpen(false);
    const toggleSearch = () => setIsOpen(prev => !prev);

    // Global keyboard shortcut (Cmd/Ctrl + K)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                toggleSearch();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <SearchContext.Provider value={{ isOpen, openSearch, closeSearch, toggleSearch }}>
            {children}
            <CommandPalette isOpen={isOpen} onClose={closeSearch} />
        </SearchContext.Provider>
    );
};
