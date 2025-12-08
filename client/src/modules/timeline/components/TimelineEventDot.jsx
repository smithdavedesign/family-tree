import React from 'react';

const TimelineEventDot = ({ event, style, onMouseEnter, onMouseLeave, onClick, isDimmed }) => {
    const getShape = (type) => {
        switch (type) {
            case 'birth': return '●'; // Circle
            case 'death': return '✕'; // Cross
            case 'marriage': return '◆'; // Diamond
            case 'education': return '■'; // Square
            case 'work': return '💼'; // Briefcase icon or similar
            case 'award': return '★'; // Star
            default: return '▲'; // Triangle for generic life events
        }
    };

    return (
        <div
            className={`timeline-event-dot type-${event.type} ${isDimmed ? 'dimmed' : ''}`}
            style={style}
            onMouseEnter={(e) => onMouseEnter(e, event)}
            onMouseLeave={onMouseLeave}
            onClick={(e) => onClick && onClick(e, event)}
            aria-label={`${event.label} - ${event.personName}`}
        >
            <span className="event-icon">{getShape(event.type)}</span>
        </div>
    );
};

export default TimelineEventDot;
