import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, ReferenceLine
} from 'recharts';
import type { LoadAvgPoint } from '../types';

interface LoadAvgChartProps {
    history: LoadAvgPoint[];
    coreCount?: number;
}

export default function LoadAvgChart({
    history,
    coreCount = navigator.hardwareConcurrency || 4,
}: LoadAvgChartProps) {

    // Determine current load state from the latest data point
    const latest1m = history.length > 0 ? history[history.length - 1].load1m : 0;
    const isHighLoad = latest1m > coreCount;

    // Dynamically pick colors based on load state
    const line1mColor = isHighLoad ? '#ef4444' : '#00d4ff';
    const grad1mHigh = '#ef4444';
    const grad1mNormal = '#00d4ff';

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const val = payload[0]?.value as number;
            const high = val > coreCount;
            return (
                <div className="chart-tooltip">
                    <p className="tooltip-time">{label}</p>
                    <p className="tooltip-value">
                        <strong>{val?.toFixed(2)}</strong>
                        {high
                            ? <span className="tooltip-tag high"> ⚠ High Load</span>
                            : <span className="tooltip-tag normal"> Normal</span>}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className={`chart-card${isHighLoad ? ' chart-card--alert' : ''}`}>
            <div className="chart-header">
                <div>
                    <h3 className="chart-title">
                        Load Average Trends
                        {isHighLoad && <span className="chart-alert-badge">⚠ HIGH LOAD</span>}
                    </h3>
                    <p className="chart-subtitle">
                        Real-time load monitoring (1m, 5m, 15m) — threshold: {coreCount} cores
                    </p>
                </div>
                <div className="chart-legend">
                    <span className="legend-item">
                        <span className="legend-dot" style={{ background: line1mColor }} />
                        1 min
                    </span>
                    <span className="legend-item">
                        <span className="legend-dot" style={{ background: '#a855f7' }} />
                        5 min
                    </span>
                    <span className="legend-item">
                        <span className="legend-dot dashed" style={{ borderColor: '#94a3b8' }} />
                        15 min
                    </span>
                </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id="grad1m" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={isHighLoad ? grad1mHigh : grad1mNormal} stopOpacity={0.35} />
                            <stop offset="95%" stopColor={isHighLoad ? grad1mHigh : grad1mNormal} stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="grad5m" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#a855f7" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="grad15m" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.15} />
                            <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" />
                    <XAxis
                        dataKey="time"
                        tick={{ fill: '#64748b', fontSize: 11 }}
                        tickLine={false}
                        interval="preserveStartEnd"
                    />
                    <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} />
                    {/* Saturation threshold line */}
                    <ReferenceLine
                        y={coreCount}
                        stroke="#ef4444"
                        strokeDasharray="6 3"
                        strokeOpacity={0.6}
                        label={{ value: `${coreCount} cores`, fill: '#ef4444', fontSize: 10, position: 'insideTopRight' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="load1m" stroke={line1mColor} strokeWidth={2}
                        fill="url(#grad1m)" dot={false} name="1 min"
                        style={{ transition: 'stroke 0.5s ease' }} />
                    <Area type="monotone" dataKey="load5m" stroke="#a855f7" strokeWidth={2}
                        fill="url(#grad5m)" dot={false} name="5 min" />
                    <Area type="monotone" dataKey="load15m" stroke="#94a3b8" strokeWidth={1.5}
                        strokeDasharray="5 5" fill="url(#grad15m)" dot={false} name="15 min" />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
