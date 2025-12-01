import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const Breadcrumbs = ({ items = [] }) => {
    return (
        <nav className="flex items-center gap-2 text-sm px-4 py-2 bg-white/50 backdrop-blur-sm border-b border-slate-100" aria-label="Breadcrumb">
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
        </nav>
    );
};

export default Breadcrumbs;
