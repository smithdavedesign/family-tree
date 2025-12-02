import React, { useMemo, useRef, useState } from 'react';
import { getTimelineRange, groupEventsByYear } from '../utils/timelineUtils';
import TimelineEventDot from './TimelineEventDot';
import TimelineTooltip from './TimelineTooltip';

const PIXELS_PER_YEAR = 50; // Width of one year in pixels

const TimelineScroller = ({ events }) => {
    const scrollRef = useRef(null);
    const [tooltipData, setTooltipData] = useState({ visible: false, event: null, x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);

    const { minYear, maxYear } = useMemo(() => getTimelineRange(events), [events]);
    const totalYears = maxYear - minYear + 1;
    const totalWidth = totalYears * PIXELS_PER_YEAR;

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
        const walk = (x - startX) * 1.5; // Scroll-fast
        scrollRef.current.scrollLeft = scrollLeft - walk;
    };

    const handleMouseEnter = (e, event) => {
        if (isDragging) return; // Don't show tooltip while dragging
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

    // Generate year markers and heatmap segments
    const yearMarkers = [];
    const heatmapSegments = [];

    for (let year = minYear; year <= maxYear; year++) {
        const left = (year - minYear) * PIXELS_PER_YEAR;

        if (year % 10 === 0) { // Show decade markers
            yearMarkers.push(
                <div key={year} className="timeline-year-marker" style={{ left }}>
                    {year}
                    <div className="timeline-year-tick" />
                </div>
            );
        }

        // Heatmap segment
        const count = yearCounts[year] || 0;
        if (count > 0) {
            const intensity = Math.min(count / maxEvents, 0.5); // Cap opacity
            heatmapSegments.push(
                <div
                    key={`heat-${year}`}
                    style={{
                        position: 'absolute',
                        left,
                        width: PIXELS_PER_YEAR,
                        height: '100%',
                        backgroundColor: `rgba(20, 184, 166, ${intensity})`, // Teal tint
                        pointerEvents: 'none'
                    }}
                />
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
        >
            <div className="timeline-track" style={{ width: totalWidth, minHeight: '60vh' }}>

                {/* Heatmap Background */}
                <div className="absolute inset-0 z-0">
                    {heatmapSegments}
                </div>

                {/* Axis */}
                <div className="timeline-axis">
                    {yearMarkers}
                </div>

                {/* Events */}
                {events.map((event, index) => {
                    const yearDiff = event.date.getFullYear() - minYear;
                    const dayOfYear = (event.date - new Date(event.date.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24;
                    const yearFraction = dayOfYear / 366;

                    const left = (yearDiff + yearFraction) * PIXELS_PER_YEAR;

                    // Simple vertical distribution to avoid overlap (random for now, could be smarter)
                    // Using a deterministic hash based on personId to keep it consistent for the same person
                    const personHash = event.personId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                    const top = 10 + (personHash % 80); // Percentage from top

                    return (
                        <TimelineEventDot
                            key={event.id}
                            event={event}
                            style={{ left: `${left}px`, top: `${top}%` }}
                            onMouseEnter={handleMouseEnter}
                            onMouseLeave={handleMouseLeave}
                        />
                    );
                })}
            </div>

            <TimelineTooltip
                visible={tooltipData.visible}
                event={tooltipData.event}
                position={{ x: tooltipData.x, y: tooltipData.y }}
            />
        </div>
    );
};

export default TimelineScroller;
