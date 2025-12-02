import React from 'react';

const TimelineEventDot = ({ event, style, onMouseEnter, onMouseLeave }) => {
    return (
        <div
            className={`timeline-event-dot type-${event.type}`}
            style={style}
            onMouseEnter={(e) => onMouseEnter(e, event)}
            onMouseLeave={onMouseLeave}
            aria-label={`${event.label} - ${event.personName}`}
        />
    );
};

export default TimelineEventDot;
