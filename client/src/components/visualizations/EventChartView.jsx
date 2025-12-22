import React, { useState, useMemo } from 'react';
import {
    ResponsiveContainer,
    ScatterChart,
    Scatter,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ZAxis,
} from 'recharts';
import { aggregateTimeline, transformForRecharts } from '../../utils/treeUtils';
import { Select } from '../ui';

/**
 * EventChartView - Recharts-based event visualization
 * Shows births, deaths, marriages, and life events on a timeline scatter plot
 * Note: This is different from the dedicated TimelinePage (/tree/:id/timeline)
 */
const EventChartView = ({ persons, relationships, lifeEvents = [], onEventClick }) => {
    const [selectedPerson, setSelectedPerson] = useState('all');
    const [selectedEventTypes, setSelectedEventTypes] = useState({
        birth: true,
        death: true,
        marriage: true,
        life_event: true,
    });

    // Aggregate all events
    const allEvents = useMemo(() => {
        return aggregateTimeline(persons, relationships, lifeEvents);
    }, [persons, relationships, lifeEvents]);

    // Filter events based on selections
    const filteredEvents = useMemo(() => {
        let events = allEvents;

        // Filter by person
        if (selectedPerson !== 'all') {
            events = events.filter(e => e.person && e.person.id === selectedPerson);
        }

        // Filter by event type
        events = events.filter(e => selectedEventTypes[e.type]);

        return events;
    }, [allEvents, selectedPerson, selectedEventTypes]);

    // Transform for Recharts
    const chartData = useMemo(() => {
        return transformForRecharts(filteredEvents, persons);
    }, [filteredEvents, persons]);

    // Get event type color and shape
    const getEventStyle = (type) => {
        const styles = {
            birth: { fill: '#10b981', shape: 'circle' },
            death: { fill: '#64748b', shape: 'square' },
            marriage: { fill: '#ec4899', shape: 'diamond' },
            life_event: { fill: '#3b82f6', shape: 'circle' },
        };
        return styles[type] || styles.life_event;
    };

    // Custom tooltip
    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-200">
                    <p className="font-semibold text-slate-900">{data.label}</p>
                    <p className="text-sm text-slate-600">
                        {new Date(data.x).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </p>
                    {data.description && (
                        <p className="text-xs text-slate-500 mt-1">{data.description}</p>
                    )}
                </div>
            );
        }
        return null;
    };

    // Custom dot shape based on event type
    const CustomDot = (props) => {
        const { cx, cy, payload } = props;
        const style = getEventStyle(payload.type);

        if (style.shape === 'circle') {
            return <circle cx={cx} cy={cy} r={6} fill={style.fill} stroke="white" strokeWidth={2} />;
        } else if (style.shape === 'square') {
            return <rect x={cx - 6} y={cy - 6} width={12} height={12} fill={style.fill} stroke="white" strokeWidth={2} />;
        } else if (style.shape === 'diamond') {
            return (
                <path
                    d={`M ${cx} ${cy - 8} L ${cx + 8} ${cy} L ${cx} ${cy + 8} L ${cx - 8} ${cy} Z`}
                    fill={style.fill}
                    stroke="white"
                    strokeWidth={2}
                />
            );
        }
        return null;
    };

    const handleEventTypeToggle = (type) => {
        setSelectedEventTypes(prev => ({
            ...prev,
            [type]: !prev[type]
        }));
    };

    const handleDotClick = (data) => {
        if (onEventClick && data.person) {
            onEventClick(null, { data: data.person });
        }
    };

    if (allEvents.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-slate-400">
                <p>No events to display</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-white p-3 sm:p-6">
            {/* Header */}
            <div className="mb-6">
                <h3 className="text-lg font-semibold text-slate-900">Family Timeline</h3>
                <p className="text-sm text-slate-500">Showing {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''}</p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-6">
                {/* Person filter */}
                <div className="flex items-center gap-2">
                    <Select
                        id="person-filter"
                        value={selectedPerson}
                        onChange={setSelectedPerson}
                        options={[
                            { value: 'all', label: 'All People' },
                            ...persons.map(person => ({
                                value: person.id,
                                label: `${person.first_name} ${person.last_name || ''}`
                            }))
                        ]}
                        className="!w-48"
                    />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full sm:w-auto">
                    <span className="hidden sm:inline text-sm font-semibold text-slate-700">Show:</span>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-3 sm:gap-x-8">
                        {Object.entries(selectedEventTypes).map(([type, isSelected]) => (
                            <label key={type} className="flex items-center gap-2 cursor-pointer group select-none">
                                <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleEventTypeToggle(type)}
                                    className="w-4.5 h-4.5 sm:w-5 sm:h-5 rounded border-slate-300 text-teal-600 focus:ring-teal-500 focus:ring-offset-0 transition-all cursor-pointer"
                                />
                                <span className="text-xs sm:text-sm font-medium capitalize text-slate-600 group-hover:text-slate-900 transition-colors">
                                    {type.replace('_', ' ')}
                                </span>
                            </label>
                        ))}
                    </div>
                </div>
            </div>

            {/* Chart */}
            <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart
                        margin={{ top: 10, right: 10, bottom: 35, left: 10 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis
                            type="number"
                            dataKey="x"
                            name="Date"
                            domain={['dataMin', 'dataMax']}
                            tickFormatter={(timestamp) => new Date(timestamp).getFullYear()}
                            label={{ value: 'Year', position: 'insideBottom', offset: -10 }}
                        />
                        <YAxis
                            type="number"
                            dataKey="y"
                            name="Person"
                            hide
                        />
                        <ZAxis range={[100, 100]} />
                        <Tooltip content={<CustomTooltip />} />
                        <Scatter
                            data={chartData}
                            shape={<CustomDot />}
                            onClick={handleDotClick}
                            style={{ cursor: 'pointer' }}
                        />
                    </ScatterChart>
                </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="flex justify-center gap-6 mt-4 pt-4 border-t border-slate-200">
                {[
                    { type: 'birth', label: 'Birth', color: '#10b981', shape: 'circle' },
                    { type: 'death', label: 'Death', color: '#64748b', shape: 'square' },
                    { type: 'marriage', label: 'Marriage', color: '#ec4899', shape: 'diamond' },
                    { type: 'life_event', label: 'Life Event', color: '#3b82f6', shape: 'circle' },
                ].map(({ type, label, color, shape }) => (
                    <div key={type} className="flex items-center gap-2">
                        {shape === 'circle' && (
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
                        )}
                        {shape === 'square' && (
                            <div className="w-3 h-3" style={{ backgroundColor: color }}></div>
                        )}
                        {shape === 'diamond' && (
                            <div className="w-3 h-3 transform rotate-45" style={{ backgroundColor: color }}></div>
                        )}
                        <span className="text-xs text-slate-600">{label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default EventChartView;
