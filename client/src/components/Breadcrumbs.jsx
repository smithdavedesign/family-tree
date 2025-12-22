import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home, ArrowLeft } from 'lucide-react';

const Breadcrumbs = ({ items = [], inline = false, showHome = true, backItem = null }) => {
    const content = (
        <div className={`flex items-center gap-2 text-sm overflow-x-auto whitespace-nowrap no-scrollbar ${!inline ? 'max-w-[1600px] mx-auto px-4 py-2.5' : ''}`}>
            {backItem && (
                <>
                    <Link
                        to={backItem.href}
                        className="flex items-center gap-1 text-teal-600 hover:text-teal-700 transition-colors font-semibold shrink-0"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span className="truncate max-w-[120px] sm:max-w-[200px]">{backItem.label}</span>
                    </Link>
                    <div className="w-px h-4 bg-slate-200 mx-1 shrink-0" aria-hidden="true" />
                </>
            )}

            {showHome && (
                <Link
                    to="/trees"
                    className="flex items-center gap-1.5 text-slate-500 hover:text-teal-600 transition-colors shrink-0"
                    aria-label="Home"
                >
                    <Home className="w-3.5 h-3.5" />
                    <span className="font-medium hidden sm:inline">My Trees</span>
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
                            <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" aria-hidden="true" />
                        )}

                        {index === items.length - 1 ? (
                            <span className="text-slate-900 font-bold truncate max-w-[150px] sm:max-w-none" aria-current="page">
                                {item.label}
                            </span>
                        ) : item.onClick ? (
                            <button
                                onClick={item.onClick}
                                className="text-slate-500 hover:text-teal-600 transition-colors font-medium hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 rounded px-1 shrink-0 truncate max-w-[120px] sm:max-w-none"
                            >
                                {item.label}
                            </button>
                        ) : (
                            <Link
                                to={item.href}
                                className="text-slate-500 hover:text-teal-600 transition-colors font-medium shrink-0 truncate max-w-[120px] sm:max-w-none"
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
        <nav className="bg-white border-b border-slate-200 shadow-sm" aria-label="Breadcrumb">
            {content}
        </nav>
    );
};

export default Breadcrumbs;
