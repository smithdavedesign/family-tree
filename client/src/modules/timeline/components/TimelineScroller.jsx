import React, { useMemo, useRef, useState } from 'react';
import { getTimelineRange, groupEventsByYear } from '../utils/timelineUtils';
import TimelineEventDot from './TimelineEventDot';
import TimelineTooltip from './TimelineTooltip';

const BASE_PIXELS_PER_YEAR = 50;

const TimelineScroller = ({ events, persons = [] }) => {
    const scrollRef = useRef(null);
    const [tooltipData, setTooltipData] = useState({ visible: false, event: null, x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);

    // New State
    const [zoomLevel, setZoomLevel] = useState(1);
    const [highlightedPersonId, setHighlightedPersonId] = useState(null);

    const pixelsPerYear = BASE_PIXELS_PER_YEAR * zoomLevel;

    const { minYear, maxYear } = useMemo(() => getTimelineRange(events), [events]);
    const totalYears = maxYear - minYear + 1;
    const totalWidth = totalYears * pixelsPerYear;

    // Assign vertical tracks to persons to prevent overlap and draw bars
    // Sort persons by birth date to create a cascading effect
    const personTracks = useMemo(() => {
        const sortedPersons = [...persons].sort((a, b) => {
            const dateA = a.dob ? new Date(a.dob) : new Date(0);
            const dateB = b.dob ? new Date(b.dob) : new Date(0);
            return dateA - dateB;
        });

        const tracks = {};
        sortedPersons.forEach((p, index) => {
            tracks[p.id] = index;
        });
        return tracks;
    }, [persons]);

    // Heatmap data
    const yearCounts = useMemo(() => {
        const counts = {};
        events.forEach(e => {
            const y = e.date.getFullYear();
            counts[y] = (counts[y] || 0) + 1;
        });
        return counts;
    }, [events]);

    const maxEvents = Math.max(...Object.values(yearCounts), 1);

    // Handlers
    const handleMouseDown = (e) => {
        setIsDragging(true);
        setStartX(e.pageX - scrollRef.current.offsetLeft);
        setScrollLeft(scrollRef.current.scrollLeft);
        scrollRef.current.style.cursor = 'grabbing';
    };

    const handleMouseLeaveContainer = () => {
        setIsDragging(false);
        if (scrollRef.current) scrollRef.current.style.cursor = 'grab';
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        if (scrollRef.current) scrollRef.current.style.cursor = 'grab';
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const x = e.pageX - scrollRef.current.offsetLeft;
        const walk = (x - startX) * 1.5;
        scrollRef.current.scrollLeft = scrollLeft - walk;
    };

    const handleWheel = (e) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            setZoomLevel(prev => Math.min(Math.max(prev * delta, 0.5), 5));
        }
    };

    const handleMouseEnter = (e, event) => {
        if (isDragging) return;
        const rect = e.target.getBoundingClientRect();
        setTooltipData({
            visible: true,
            event,
            x: rect.left + rect.width / 2,
            y: rect.top
        });
    };

    const handleMouseLeave = () => {
        setTooltipData(prev => ({ ...prev, visible: false }));
    };

    const handleEventClick = (e, event) => {
        e.stopPropagation();
        setHighlightedPersonId(prev => prev === event.personId ? null : event.personId);
    };

    const handleBackgroundClick = () => {
        setHighlightedPersonId(null);
    };

    // Render Helpers
    const getXPosition = (date) => {
        const yearDiff = date.getFullYear() - minYear;
        const dayOfYear = (date - new Date(date.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24;
        const yearFraction = dayOfYear / 366;
        return (yearDiff + yearFraction) * pixelsPerYear;
    };

    // Generate year markers
    const yearMarkers = [];
    for (let year = minYear; year <= maxYear; year++) {
        const left = (year - minYear) * pixelsPerYear;
        if (year % 10 === 0) {
            yearMarkers.push(
                <div key={year} className="timeline-year-marker" style={{ left }}>
                    {year}
                    <div className="timeline-year-tick" />
                </div>
            );
        }
    }

    return (
        <div
            className="timeline-scroller"
            ref={scrollRef}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeaveContainer}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            onWheel={handleWheel}
            onClick={handleBackgroundClick}
        >
            <div className="timeline-track" style={{ width: totalWidth, minHeight: '80vh' }}>

                {/* Axis */}
                <div className="timeline-axis">
                    {yearMarkers}
                </div>

                {/* Lifespan Bars */}
                {persons.map(person => {
                    if (!person.dob) return null;
                    const startX = getXPosition(new Date(person.dob));
                    const endX = person.dod ? getXPosition(new Date(person.dod)) : getXPosition(new Date());
                    const trackIndex = personTracks[person.id] || 0;
                    const top = 60 + (trackIndex * 30); // 30px per track

                    const isDimmed = highlightedPersonId && highlightedPersonId !== person.id;
                    const isHighlighted = highlightedPersonId === person.id;

                    return (
                        <div
                            key={`lifespan-${person.id}`}
                            className={`lifespan-bar ${isDimmed ? 'dimmed' : ''} ${isHighlighted ? 'highlighted' : ''}`}
                            style={{
                                left: startX,
                                width: Math.max(endX - startX, 5),
                                top: `${top}px`
                            }}
                        >
                            <span className="lifespan-name">{person.first_name} {person.last_name}</span>
                        </div>
                    );
                })}

                {/* Events */}
                {events.map((event) => {
                    const left = getXPosition(event.date);
                    const trackIndex = personTracks[event.personId] || 0;
                    const top = 60 + (trackIndex * 30) - 6; // Center on bar

                    const isDimmed = highlightedPersonId && highlightedPersonId !== event.personId;

                    return (
                        <TimelineEventDot
                            key={event.id}
                            event={event}
                            style={{ left: `${left}px`, top: `${top}px` }}
                            onMouseEnter={handleMouseEnter}
                            onMouseLeave={handleMouseLeave}
                            onClick={handleEventClick}
                            isDimmed={isDimmed}
                        />
                    );
                })}
            </div>

            <TimelineTooltip
                visible={tooltipData.visible}
                event={tooltipData.event}
                position={{ x: tooltipData.x, y: tooltipData.y }}
            />

            {/* Zoom Controls Overlay */}
            <div className="timeline-controls">
                <button onClick={() => setZoomLevel(z => Math.min(z * 1.2, 5))}>+</button>
                <button onClick={() => setZoomLevel(z => Math.max(z * 0.8, 0.5))}>-</button>
            </div>
        </div>
    );
};

export default TimelineScroller;
