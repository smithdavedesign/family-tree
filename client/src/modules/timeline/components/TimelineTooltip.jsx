import React from 'react';
import { createPortal } from 'react-dom';
import { format } from 'date-fns';
import { calculateAgeAtEvent } from '../utils/timelineUtils';

const TimelineTooltip = ({ event, position, visible }) => {
    if (!visible || !event) return null;

    const age = event.metadata?.dob ? calculateAgeAtEvent(event.metadata.dob, event.date) : null;

    // Portal to document.body to avoid clipping issues
    return createPortal(
        <div
            className="timeline-tooltip"
            style={{
                left: position.x,
                top: position.y,
                transform: 'translate(-50%, -100%)', // Center horizontally, place above
                marginTop: '-15px' // Gap
            }}
        >
            <div className="timeline-tooltip-header">
                {event.personName}
            </div>

            <div className="timeline-tooltip-row">
                <span className="timeline-tooltip-label">Event</span>
                <span className="timeline-tooltip-value">{event.label}</span>
            </div>

            <div className="timeline-tooltip-row">
                <span className="timeline-tooltip-label">Date</span>
                <span className="timeline-tooltip-value">{format(event.date, 'MMM d, yyyy')}</span>
            </div>

            {age !== null && (
                <div className="timeline-tooltip-row">
                    <span className="timeline-tooltip-label">Age</span>
                    <span className="timeline-tooltip-value">{age} years old</span>
                </div>
            )}

            {event.description && (
                <div className="mt-2 pt-2 border-t border-gray-100 text-sm text-gray-600 italic">
                    {event.description}
                </div>
            )}
        </div>,
        document.body
    );
};

export default TimelineTooltip;
