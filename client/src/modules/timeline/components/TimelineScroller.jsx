import React, { useMemo, useRef, useState } from 'react';
import { getTimelineRange, groupEventsByYear } from '../utils/timelineUtils';
import TimelineEventDot from './TimelineEventDot';
import TimelineTooltip from './TimelineTooltip';

const PIXELS_PER_YEAR = 50; // Width of one year in pixels

const TimelineScroller = ({ events }) => {
    const scrollRef = useRef(null);
    const [tooltipData, setTooltipData] = useState({ visible: false, event: null, x: 0, y: 0 });

    const { minYear, maxYear } = useMemo(() => getTimelineRange(events), [events]);
    const totalYears = maxYear - minYear + 1;
    const totalWidth = totalYears * PIXELS_PER_YEAR;

    const handleMouseEnter = (e, event) => {
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

    // Generate year markers
    const yearMarkers = [];
    for (let year = minYear; year <= maxYear; year++) {
        if (year % 10 === 0) { // Show decade markers
            const left = (year - minYear) * PIXELS_PER_YEAR;
            yearMarkers.push(
                <div key={year} className="timeline-year-marker" style={{ left }}>
                    {year}
                    <div className="timeline-year-tick" />
                </div>
            );
        }
    }

    return (
        <div className="timeline-scroller" ref={scrollRef}>
            <div className="timeline-track" style={{ width: totalWidth, minHeight: '60vh' }}>

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
