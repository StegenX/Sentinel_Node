interface MemoryCardProps {
    freeMemPercentage: number; // 0–100 % free
}

// Circular progress ring using SVG
function CircularProgress({ value }: { value: number }) {
    const r = 40;
    const circ = 2 * Math.PI * r;
    const usedPct = 100 - value; // convert "free" to "used"
    const offset = circ - (circ * usedPct) / 100;

    const color = usedPct > 80 ? '#ef4444' : usedPct > 60 ? '#f59e0b' : '#a855f7';

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
                style={{ transition: 'stroke-dashoffset 0.6s ease', filter: `drop-shadow(0 0 5px ${color})` }}
            />
            <text x="50" y="55" textAnchor="middle" fill="#e2e8f0" fontSize="14" fontFamily="Inter, sans-serif">
                {Math.round(usedPct)}%
            </text>
        </svg>
    );
}

export default function MemoryCard({ freeMemPercentage }: MemoryCardProps) {
    const usedPct = 100 - freeMemPercentage;
    // Estimate GB from percentage (assume 16 GB total as a display value)
    const totalGB = 16;
    const usedGB = (totalGB * usedPct) / 100;

    const trend = usedPct > 50 ? '▲' : '▼';
    const trendColor = usedPct > 70 ? '#ef4444' : '#f59e0b';

    return (
        <div className="metric-card">
            <div className="card-header">
                <span className="card-icon mem-icon">✦</span>
                <span className="card-label">Memory</span>
                <span className="card-trend" style={{ color: trendColor }}>
                    {trend} {Math.round(usedPct)}%
                </span>
            </div>
            <div className="card-value">
                {usedGB.toFixed(1)}<span className="card-unit">GB</span>
            </div>
            <div className="card-sub">of {totalGB} GB Total</div>
            <div className="circular-container">
                <CircularProgress value={freeMemPercentage} />
            </div>
            <div className="mem-bar-track">
                <div
                    className="mem-bar-fill"
                    style={{ width: `${usedPct}%`, background: usedPct > 80 ? '#ef4444' : '#a855f7' }}
                />
            </div>
        </div>
    );
}
