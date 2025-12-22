import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import LazyImage from './LazyImage';
import { User, MoreVertical, FolderPlus, CheckCircle2, Circle } from 'lucide-react';

const GAP = 12; // px
const TARGET_ROW_HEIGHT = 280; // Ideal height for desktop
const MOBILE_TARGET_HEIGHT = 220; // Ideal height for mobile

const VirtualGallery = ({ groups, groupBy, onPhotoClick, selectedIds = new Set(), onToggleSelect, onAddToAlbum }) => {
    const parentRef = useRef(null);
    const [activeMenuId, setActiveMenuId] = useState(null);

    const [containerWidth, setContainerWidth] = useState(0);

    // Track container width for layout calculations
    useEffect(() => {
        if (!parentRef.current) return;
        const observer = new ResizeObserver((entries) => {
            for (let entry of entries) {
                // Subtract padding
                setContainerWidth(entry.contentRect.width - 8); // 8px for padding
            }
        });
        observer.observe(parentRef.current);
        return () => observer.disconnect();
    }, []);

    // Flatten the groups into a list of "rows" for the virtualizer using a justified layout algorithm
    const rows = useMemo(() => {
        if (containerWidth <= 0) return [];

        const result = [];
        const isMobile = containerWidth < 640;
        const targetHeight = isMobile ? MOBILE_TARGET_HEIGHT : TARGET_ROW_HEIGHT;

        groups.forEach(group => {
            // Add Header Row
            result.push({
                type: 'header',
                data: group,
                height: 60
            });

            const photos = group.items;
            let currentRow = [];
            let currentRowAR = 0;

            photos.forEach((photo) => {
                const ar = (photo.width || 1200) / (photo.height || 800);
                currentRow.push({ ...photo, ar });
                currentRowAR += ar;

                // If the row is "full" enough (width with target height exceeds container)
                if (currentRowAR * targetHeight >= containerWidth - (currentRow.length - 1) * GAP) {
                    const rowHeight = (containerWidth - (currentRow.length - 1) * GAP) / currentRowAR;
                    result.push({
                        type: 'photos',
                        items: currentRow,
                        height: rowHeight
                    });
                    currentRow = [];
                    currentRowAR = 0;
                }
            });

            // Handle remaining photos in a non-full row (last row of a group)
            if (currentRow.length > 0) {
                let rowHeight = targetHeight;
                let isPartial = true;

                if (currentRow.length === 1) {
                    const photo = currentRow[0];
                    if (isMobile) {
                        // On mobile, full width is fine for landscape
                        if (photo.ar > 1.3) {
                            rowHeight = Math.min(350, containerWidth / photo.ar);
                            isPartial = false;
                        } else {
                            rowHeight = Math.min(450, targetHeight * 1.5);
                            isPartial = true;
                        }
                    } else {
                        // On desktop, NEVER stretch single photos across full width
                        // Limit height and keep as partial (centered)
                        rowHeight = Math.min(480, targetHeight * 1.6);
                        isPartial = true;
                    }
                } else if (currentRow.length === 2 && !isMobile) {
                    // Two photos on desktop: make them slightly larger but centered
                    rowHeight = Math.min(380, targetHeight * 1.3);
                    isPartial = true;
                } else {
                    rowHeight = Math.min(targetHeight * 1.2, (containerWidth - (currentRow.length - 1) * GAP) / currentRowAR);
                }

                result.push({
                    type: 'photos',
                    items: currentRow,
                    height: rowHeight,
                    isPartial
                });
            }
        });

        return result;
    }, [groups, containerWidth]);

    const rowVirtualizer = useVirtualizer({
        count: rows.length,
        getScrollElement: () => parentRef.current,
        estimateSize: (i) => rows[i].height + GAP, // Include gap in estimation
        overscan: 5,
    });

    return (
        <div
            ref={parentRef}
            className="h-full overflow-y-auto w-full pr-2"
            onClick={() => setActiveMenuId(null)} // Close menu on outside click
        >
            <div
                style={{
                    height: `${rowVirtualizer.getTotalSize()}px`,
                    width: '100%',
                    position: 'relative',
                }}
            >
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                    const row = rows[virtualRow.index];

                    return (
                        <div
                            key={virtualRow.key}
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: `${row.height}px`,
                                transform: `translateY(${virtualRow.start}px)`,
                            }}
                        >
                            {row.type === 'header' ? (
                                <div className="flex items-center gap-3 py-2 bg-slate-50/95 backdrop-blur z-10">
                                    {groupBy === 'person' ? (
                                        <>
                                            <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-200 border border-slate-300 flex-shrink-0">
                                                {row.data.photo ? (
                                                    <img src={row.data.photo} alt={row.data.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <User className="w-full h-full p-2 text-slate-400" />
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-slate-800">{row.data.name}</h3>
                                                {row.data.dob && (
                                                    <p className="text-xs text-slate-500">Born {new Date(row.data.dob).getFullYear()}</p>
                                                )}
                                            </div>
                                        </>
                                    ) : (
                                        <h3 className="font-semibold text-slate-700 text-lg">{row.data.title}</h3>
                                    )}
                                </div>
                            ) : (
                                <div
                                    className="flex"
                                    style={{ gap: `${GAP}px`, height: `${row.height}px` }}
                                >
                                    {row.items.map(photo => {
                                        const isSelected = selectedIds.has(photo.id);
                                        const width = row.isPartial ? row.height * photo.ar : 'auto';

                                        return (
                                            <div
                                                key={photo.id}
                                                className={`group relative bg-slate-200 rounded-lg overflow-hidden cursor-pointer transition-all ${isSelected ? 'ring-4 ring-teal-500 ring-inset' : 'hover:shadow-md'
                                                    }`}
                                                style={{
                                                    height: '100%',
                                                    width: row.isPartial ? `${width}px` : 'auto',
                                                    flexGrow: row.isPartial ? 0 : photo.ar,
                                                    flexShrink: 0,
                                                    minWidth: '0' // Prevent content from forcing width
                                                }}
                                                onClick={() => onPhotoClick && onPhotoClick(photo)}
                                            >
                                                <LazyImage
                                                    src={photo.url}
                                                    alt={photo.caption || 'Family photo'}
                                                    width={photo.width}
                                                    height={photo.height}
                                                    className="w-full h-full"
                                                />
                                                {/* Selection Checkbox */}
                                                {onToggleSelect && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onToggleSelect(photo.id);
                                                        }}
                                                        className={`absolute top-2 left-2 p-1 rounded-full transition-all z-20 ${isSelected
                                                            ? 'bg-teal-500 text-white opacity-100'
                                                            : 'bg-black/30 text-white/70 opacity-0 group-hover:opacity-100 hover:bg-black/50'
                                                            }`}
                                                    >
                                                        {isSelected ? (
                                                            <CheckCircle2 className="w-5 h-5" />
                                                        ) : (
                                                            <Circle className="w-5 h-5" />
                                                        )}
                                                    </button>
                                                )}

                                                {/* More Menu */}
                                                <div className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setActiveMenuId(activeMenuId === photo.id ? null : photo.id);
                                                        }}
                                                        className="p-1.5 bg-black/30 hover:bg-black/50 text-white rounded-full backdrop-blur-sm"
                                                    >
                                                        <MoreVertical className="w-4 h-4" />
                                                    </button>

                                                    {/* Dropdown Menu */}
                                                    {activeMenuId === photo.id && (
                                                        <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-xl border border-slate-100 py-1 z-30 animate-in fade-in zoom-in-95 duration-100">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    onAddToAlbum(photo.id);
                                                                    setActiveMenuId(null);
                                                                }}
                                                                className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                                            >
                                                                <FolderPlus className="w-4 h-4 text-slate-400" />
                                                                Add to Album
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Overlay Info */}
                                                {(photo.caption || photo.location) && (
                                                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                                        <p className="text-white text-xs truncate font-medium">{photo.caption || 'No caption'}</p>
                                                        {photo.location && (
                                                            <p className="text-white/80 text-[10px] truncate">{photo.location}</p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default VirtualGallery;
