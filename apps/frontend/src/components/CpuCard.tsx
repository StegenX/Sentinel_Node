interface CpuCardProps {
    cpuLoad: number;
    coreCount?: number;
}

// Circular progress ring — same style as MemoryCard
function CircularProgress({ value }: { value: number }) {
    const r = 40;
    const circ = 2 * Math.PI * r;
    const clamped = Math.min(Math.max(value, 0), 100);
    const offset = circ - (circ * clamped) / 100;
    const color = clamped > 80 ? '#ef4444' : clamped > 60 ? '#f59e0b' : '#00d4ff';

    return (
        <svg width="100" height="100" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r={r} fill="none" stroke="#1e2a3a" strokeWidth="10" />
            <circle
                cx="50" cy="50" r={r}
                fill="none"
                stroke={color}
                strokeWidth="10"
                strokeDasharray={circ}
                strokeDashoffset={offset}
                strokeLinecap="round"
                transform="rotate(-90 50 50)"
                style={{ transition: 'stroke-dashoffset 0.5s ease, stroke 0.3s ease', filter: `drop-shadow(0 0 5px ${color})` }}
            />
            <text x="50" y="55" textAnchor="middle" fill="#e2e8f0" fontSize="14" fontFamily="Inter, sans-serif">
                {Math.round(clamped)}%
            </text>
        </svg>
    );
}

export default function CpuCard({ cpuLoad, coreCount = 8 }: CpuCardProps) {
    const trend = cpuLoad > 50 ? '▲' : '▼';
    const trendColor = cpuLoad > 50 ? '#ef4444' : '#22c55e';

    return (
        <div className="metric-card">
            <div className="card-header">
                <span className="card-icon cpu-icon">▣</span>
                <span className="card-label">CPU Load</span>
                <span className="card-trend" style={{ color: trendColor }}>
                    {trend} {Math.round(cpuLoad * 10) / 10}%
                </span>
            </div>
            <div className="card-value">{Math.round(cpuLoad)}%</div>
            <div className="card-sub">{coreCount} cores active</div>
            <div className="circular-container">
                <CircularProgress value={cpuLoad} />
            </div>
        </div>
    );
}
