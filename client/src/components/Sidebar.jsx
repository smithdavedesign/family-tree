import React, { useState } from 'react';
import { LayoutDashboard, Users, Archive, Star, ChevronLeft, ChevronRight, Clock } from 'lucide-react';

const Sidebar = ({ activeView = 'all', onViewChange, className = '' }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);

    const menuItems = [
        { id: 'all', label: 'All Trees', icon: <LayoutDashboard className="w-5 h-5" /> },
        { id: 'shared', label: 'Shared with Me', icon: <Users className="w-5 h-5" /> },
        { id: 'recent', label: 'Recent', icon: <Clock className="w-5 h-5" /> },
        { id: 'favorites', label: 'Favorites', icon: <Star className="w-5 h-5" /> },
        { id: 'archived', label: 'Archived', icon: <Archive className="w-5 h-5" /> },
    ];

    return (
        <aside
            className={`
                bg-white border-r border-slate-200 h-[calc(100vh-64px)] sticky top-16 
                transition-all duration-300 ease-in-out flex flex-col
                ${isCollapsed ? 'w-16' : 'w-64'}
                ${className}
            `}
        >
            {/* Toggle Button */}
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="absolute -right-3 top-6 bg-white border border-slate-200 rounded-full p-1 shadow-sm hover:shadow-md hover:text-teal-600 transition-all z-10"
                aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
                {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>

            {/* Menu Items */}
            <nav className="flex-1 py-6 px-3 space-y-1">
                {menuItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => onViewChange && onViewChange(item.id)}
                        className={`
                            w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors
                            ${activeView === item.id
                                ? 'bg-teal-50 text-teal-700 font-medium'
                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                            }
                            ${isCollapsed ? 'justify-center' : ''}
                        `}
                        title={isCollapsed ? item.label : undefined}
                    >
                        <span className={`${activeView === item.id ? 'text-teal-600' : 'text-slate-400'}`}>
                            {item.icon}
                        </span>

                        {!isCollapsed && (
                            <span className="truncate animate-fadeIn">
                                {item.label}
                            </span>
                        )}
                    </button>
                ))}
            </nav>

            {/* Footer / User Info (Optional) */}
            {!isCollapsed && (
                <div className="p-4 border-t border-slate-100 text-xs text-slate-400 text-center animate-fadeIn">
                    Roots & Branches v1.0
                </div>
            )}
        </aside>
    );
};

export default Sidebar;
