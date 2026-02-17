import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Settings, ChevronDown, TreePine, Zap, Search, Command } from 'lucide-react';
import { supabase } from '../auth';
import { Avatar } from './ui';
import { useSubscription } from '../context/SubscriptionContext';
import { useSearch } from '../context/SearchContext';

const Navbar = ({
    title = "Roots & Branches",
    leftContent,
    rightContent,
    user,
    onOpenSettings
}) => {
    const { tokenBalance, planTier, loading, refreshSubscription } = useSubscription() || {};
    const { toggleSearch } = useSearch();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef(null);
    const navigate = useNavigate();

    // Poll for updates more frequently or on mount
    useEffect(() => {
        refreshSubscription?.(); // Optional chaining in case context is null initially
    }, [refreshSubscription]);

    // Close menu on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    return (
        <nav className="sticky top-0 z-[10001] w-full bg-white/80 backdrop-blur-md border-b border-slate-200">
            <div className="max-w-[1600px] mx-auto px-4">
                <div className="flex justify-between items-center h-16">
                    {/* Left Side */}
                    <div className="flex items-center gap-4">
                        <Link to="/trees" className="flex items-center gap-2 group">
                            <div className="p-1.5 bg-teal-50 rounded-lg group-hover:bg-teal-100 transition-colors">
                                <TreePine className="w-6 h-6 text-teal-600" />
                            </div>
                            <span className="text-xl font-bold bg-gradient-to-r from-teal-700 to-teal-500 bg-clip-text text-transparent hidden sm:block">
                                {title}
                            </span>
                        </Link>

                        {leftContent && (
                            <div className="flex items-center gap-4 ml-4 pl-4 border-l border-slate-200">
                                {leftContent}
                            </div>
                        )}
                    </div>

                    {/* Search Trigger */}
                    <div className="flex-1 max-w-md hidden md:block px-8">
                        <button
                            onClick={() => toggleSearch()}
                            className="w-full flex items-center justify-between px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-lg border border-slate-200 transition-all text-sm group"
                        >
                            <div className="flex items-center gap-2">
                                <Search className="w-4 h-4 group-hover:text-teal-600 transition-colors" />
                                <span>Search family...</span>
                            </div>
                            <div className="flex items-center gap-1 opacity-60">
                                <Command className="w-3 h-3" />
                                <span className="text-[10px] font-bold">K</span>
                            </div>
                        </button>
                    </div>

                    {/* Right Side */}
                    <div className="flex items-center gap-3 sm:gap-4">
                        <button
                            onClick={() => toggleSearch()}
                            className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
                        >
                            <Search className="w-5 h-5" />
                        </button>
                        {rightContent}

                        {/* Credits Badge */}
                        {user && !loading && (
                            <Link to="/pricing" className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-teal-50 to-blue-50 hover:from-teal-100 hover:to-blue-100 text-teal-700 text-sm font-medium rounded-full border border-teal-200 transition-colors">
                                <Zap className="w-3.5 h-3.5 fill-teal-500 text-teal-500" />
                                <span>{tokenBalance ?? 0}</span>
                            </Link>
                        )}

                        {/* User Menu */}
                        {user && (
                            <div className="relative" ref={menuRef}>
                                <button
                                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                                    className="flex items-center gap-2 p-1 rounded-full hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                                >
                                    <Avatar
                                        src={user.user_metadata?.avatar_url}
                                        alt={user.email}
                                        size="sm"
                                    />
                                    <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {isMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-slate-100 py-1 animate-scaleIn origin-top-right">
                                        <div className="px-4 py-3 border-b border-slate-100">
                                            <p className="text-xs font-medium text-slate-500 uppercase">Signed in as</p>
                                            <p className="text-sm font-medium text-slate-900 truncate">{user.email}</p>
                                        </div>

                                        {onOpenSettings ? (
                                            <button
                                                onClick={() => {
                                                    setIsMenuOpen(false);
                                                    onOpenSettings();
                                                }}
                                                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                                            >
                                                <Settings className="w-4 h-4" />
                                                Settings
                                            </button>
                                        ) : (
                                            <Link
                                                to="/settings"
                                                onClick={() => setIsMenuOpen(false)}
                                                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                                            >
                                                <Settings className="w-4 h-4" />
                                                Settings
                                            </Link>
                                        )}

                                        <div className="border-t border-slate-100 my-1"></div>

                                        <button
                                            onClick={handleSignOut}
                                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            Sign Out
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
