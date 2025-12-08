import React, { useMemo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import LazyImage from './LazyImage';
import { User } from 'lucide-react';

const COLUMN_COUNT = 4; // Responsive logic can be added later (e.g. useWindowSize)
const GAP = 16; // px

const VirtualGallery = ({ groups, groupBy, onPhotoClick }) => {
    const parentRef = useRef(null);

    // Flatten the groups into a list of "rows" for the virtualizer
    // Each item in the list is either a 'header' or a 'photo-row'
    const rows = useMemo(() => {
        const result = [];

        groups.forEach(group => {
            // Add Header Row
            result.push({
                type: 'header',
                data: group,
                height: 60 // Fixed height for headers
            });

            // Add Photo Rows
            const photos = group.items;
            for (let i = 0; i < photos.length; i += COLUMN_COUNT) {
                const rowPhotos = photos.slice(i, i + COLUMN_COUNT);
                result.push({
                    type: 'photos',
                    items: rowPhotos,
                    height: 250 // Approximate height for photo rows (aspect ratio dependent in future)
                });
            }
        });

        return result;
    }, [groups]);

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
                                    className="grid gap-4"
                                    style={{
                                        gridTemplateColumns: `repeat(${COLUMN_COUNT}, minmax(0, 1fr))`
                                    }}
                                >
                                    {row.items.map(photo => (
                                        <div
                                            key={photo.id}
                                            className="group relative h-[250px] bg-slate-200 rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-all"
                                            onClick={() => onPhotoClick && onPhotoClick(photo)}
                                        >
                                            <LazyImage
                                                src={photo.url}
                                                alt={photo.caption || 'Family photo'}
                                                width={photo.width}
                                                height={photo.height}
                                                className="w-full h-full"
                                            />

                                            {/* Overlay Info */}
                                            {(photo.caption || photo.location) && (
                                                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <p className="text-white text-xs truncate font-medium">{photo.caption || 'No caption'}</p>
                                                    {photo.location && (
                                                        <p className="text-white/80 text-[10px] truncate">{photo.location}</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {/* Fill empty cells if row is incomplete */}
                                    {[...Array(COLUMN_COUNT - row.items.length)].map((_, i) => (
                                        <div key={`empty-${i}`} />
                                    ))}
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
