import React from 'react';
import { createPortal } from 'react-dom';
import { format } from 'date-fns';

const TimelineTooltip = ({ event, position, visible }) => {
    if (!visible || !event) return null;

    // Portal to document.body to avoid clipping issues
    return createPortal(
        <div
            className="timeline-tooltip"
            style={{
                left: position.x,
                top: position.y,
                transform: 'translate(-50%, -100%)', // Center horizontally, place above
                marginTop: '-10px' // Gap
            }}
        >
            <div className="timeline-tooltip-header">
                {event.personName}
            </div>
            <div className="timeline-tooltip-date">
                {format(event.date, 'MMMM d, yyyy')}
            </div>
            <div className="timeline-tooltip-body">
                <strong>{event.label}</strong>
                {event.description && <div>{event.description}</div>}
            </div>
        </div>,
        document.body
    );
};

export default TimelineTooltip;
