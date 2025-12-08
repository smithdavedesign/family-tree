import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const Breadcrumbs = ({ items = [], inline = false, showHome = true }) => {
    const content = (
        <div className={`flex items-center gap-2 text-sm ${!inline ? 'max-w-[1600px] mx-auto px-4 py-2' : ''}`}>
            {showHome && (
                <Link
                    to="/trees"
                    className="flex items-center gap-1.5 text-slate-600 hover:text-teal-600 transition-colors"
                    aria-label="Home"
                >
                    <Home className="w-4 h-4" />
                    <span className="font-medium">My Trees</span>
                </Link>
            )}

            {items.map((item, index) => {
                // If we're inline and not showing home, the first item shouldn't have a chevron if it's the very first thing
                // But usually breadcrumbs imply a hierarchy.
                // If showHome is false, we probably still want chevrons between items, but maybe a chevron before the first item if it's continuing from something else (like TreeSwitcher)?
                // Let's assume the parent handles the initial separator if needed, or we render chevrons for all items.

                return (
                    <React.Fragment key={index}>
                        {(showHome || index > 0) && (
                            <ChevronRight className="w-4 h-4 text-slate-400" aria-hidden="true" />
                        )}

                        {/* If showHome is false and index is 0, we might want a chevron if it's a continuation. 
                            Let's add a prop 'startWithSeparator' if needed. For now, standard behavior:
                            Separator appears BEFORE each item, EXCEPT the first one IF home is hidden? 
                            No, standard is [Home] > [Item 1] > [Item 2].
                            If [Home] is hidden: [Item 1] > [Item 2].
                            If we want [TreeSwitcher] > [Item 1], we need a separator before Item 1.
                        */}

                        {index === items.length - 1 && !item.onClick && !item.href ? (
                            <span className="text-slate-900 font-semibold" aria-current="page">
                                {item.label}
                            </span>
                        ) : item.onClick ? (
                            <button
                                onClick={item.onClick}
                                className="text-slate-600 hover:text-teal-600 transition-colors font-medium hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 rounded px-1"
                            >
                                {item.label}
                            </button>
                        ) : (
                            <Link
                                to={item.href}
                                className="text-slate-600 hover:text-teal-600 transition-colors font-medium"
                            >
                                {item.label}
                            </Link>
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );

    if (inline) return content;

    return (
        <nav className="bg-white/50 backdrop-blur-sm border-b border-slate-100" aria-label="Breadcrumb">
            {content}
        </nav>
    );
};

export default Breadcrumbs;
