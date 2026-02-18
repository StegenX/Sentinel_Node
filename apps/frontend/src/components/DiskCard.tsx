interface DiskCardProps {
    diskUsage: {
        size: number;        // GB total
        used: number;        // GB used
        usedPercentage: number;
    } | null;
}

export default function DiskCard({ diskUsage }: DiskCardProps) {
    const pct = diskUsage?.usedPercentage ?? 0;
    const used = diskUsage?.used ?? 0;
    const size = diskUsage?.size ?? 0;
    const free = size - used;

    const barColor = pct > 80 ? '#ef4444' : pct > 60 ? '#f59e0b' : '#00d4ff';

    return (
        <div className="bottom-card">
            <div className="card-header">
                <span className="card-icon">≡</span>
                <span className="card-label">Disk Usage</span>
            </div>

            <div className="disk-row">
                <div className="disk-info">
                    <span className="disk-mount">/ (root)</span>
                    <span className="disk-free">{free.toFixed(0)} GB Free</span>
                </div>
                <div className="disk-bar-track">
                    <div
                        className="disk-bar-fill"
                        style={{ width: `${pct}%`, background: barColor, transition: 'width 0.6s ease' }}
                    />
                </div>
                <div className="disk-details">
                    <span>Used: {used.toFixed(0)} GB</span>
                    <span>Total: {size.toFixed(0)} GB</span>
                </div>
            </div>

            <div className="disk-row" style={{ marginTop: '16px' }}>
                <div className="disk-info">
                    <span className="disk-mount">/home (HDD)</span>
                    <span className="disk-free">—</span>
                </div>
                <div className="disk-bar-track">
                    <div className="disk-bar-fill" style={{ width: '0%', background: '#22c55e' }} />
                </div>
                <div className="disk-details">
                    <span>N/A</span>
                    <span>N/A</span>
                </div>
            </div>
        </div>
    );
}
