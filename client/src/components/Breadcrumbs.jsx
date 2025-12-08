import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const Breadcrumbs = ({ items = [] }) => {
    return (
        <nav className="max-w-[1600px] mx-auto px-4 bg-white/50 backdrop-blur-sm border-b border-slate-100" aria-label="Breadcrumb">
            <div className="py-2 flex items-center gap-2 text-sm">
                <Link
                    to="/trees"
                    className="flex items-center gap-1.5 text-slate-600 hover:text-teal-600 transition-colors"
                    aria-label="Home"
                >
                    <Home className="w-4 h-4" />
                    <span className="font-medium">My Trees</span>
                </Link>

                {items.map((item, index) => {
                    const isLast = index === items.length - 1;

                    return (
                        <React.Fragment key={index}>
                            <ChevronRight className="w-4 h-4 text-slate-400" aria-hidden="true" />
                            {isLast ? (
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
        </nav>
    );
};

export default Breadcrumbs;
