interface UptimeCardProps {
    uptime: {
        days: number;
        hours: number;
        minutes: number;
        seconds: number;
    } | null;
}

function pad(n: number) {
    return String(n).padStart(2, '0');
}

export default function UptimeCard({ uptime }: UptimeCardProps) {
    if (!uptime) {
        return (
            <div className="metric-card uptime-card">
                <div className="card-header">
                    <span className="card-icon">⏱</span>
                    <span className="card-label">System Uptime</span>
                    <span className="healthy-badge">● HEALTHY</span>
                </div>
                <div className="uptime-display">
                    <div className="uptime-unit"><span className="uptime-num">--</span><span className="uptime-label">DAYS</span></div>
                    <div className="uptime-sep">:</div>
                    <div className="uptime-unit"><span className="uptime-num">--</span><span className="uptime-label">HRS</span></div>
                    <div className="uptime-sep">:</div>
                    <div className="uptime-unit"><span className="uptime-num">--</span><span className="uptime-label">MIN</span></div>
                    <div className="uptime-sep">:</div>
                    <div className="uptime-unit"><span className="uptime-num">--</span><span className="uptime-label">SEC</span></div>
                </div>
            </div>
        );
    }

    return (
        <div className="metric-card uptime-card">
            <div className="card-header">
                <span className="card-icon">⏱</span>
                <span className="card-label">System Uptime</span>
                <span className="healthy-badge">● HEALTHY</span>
            </div>
            <div className="uptime-display">
                <div className="uptime-unit">
                    <span className="uptime-num">{pad(uptime.days)}</span>
                    <span className="uptime-label">DAYS</span>
                </div>
                <div className="uptime-sep">:</div>
                <div className="uptime-unit">
                    <span className="uptime-num">{pad(uptime.hours)}</span>
                    <span className="uptime-label">HRS</span>
                </div>
                <div className="uptime-sep">:</div>
                <div className="uptime-unit">
                    <span className="uptime-num">{pad(uptime.minutes)}</span>
                    <span className="uptime-label">MIN</span>
                </div>
                <div className="uptime-sep">:</div>
                <div className="uptime-unit">
                    <span className="uptime-num">{pad(uptime.seconds)}</span>
                    <span className="uptime-label">SEC</span>
                </div>
            </div>
        </div>
    );
}
