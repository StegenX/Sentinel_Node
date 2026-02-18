import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';
import { useState, useEffect } from 'react';

interface NetworkCardProps {
    networkTraffic: {
        recived: number;     // % share
        transmitted: number;
    } | null;
}

export default function NetworkCard({ networkTraffic }: NetworkCardProps) {
    const [history, setHistory] = useState<{ rx: number; tx: number }[]>([]);

    useEffect(() => {
        if (!networkTraffic) return;
        setHistory(prev => {
            const next = [...prev, { rx: networkTraffic.recived, tx: networkTraffic.transmitted }];
            return next.length > 30 ? next.slice(next.length - 30) : next;
        });
    }, [networkTraffic]);

    const rx = networkTraffic?.recived ?? 0;
    const tx = networkTraffic?.transmitted ?? 0;

    return (
        <div className="bottom-card">
            <div className="card-header">
                <span className="card-icon">⌘</span>
                <span className="card-label">Network Traffic</span>
                <span className="iface-badge">eth0</span>
            </div>

            <div className="network-stats">
                <div className="net-stat">
                    <span className="net-stat-label">DOWNLOAD (RX)</span>
                    <span className="net-stat-value rx">↓ {rx.toFixed(0)} <span className="net-unit">%</span></span>
                </div>
                <div className="net-stat">
                    <span className="net-stat-label">UPLOAD (TX)</span>
                    <span className="net-stat-value tx">↑ {tx.toFixed(0)} <span className="net-unit">%</span></span>
                </div>
            </div>

            <ResponsiveContainer width="100%" height={80}>
                <AreaChart data={history} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="gradRx" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gradTx" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <Tooltip
                        contentStyle={{ background: '#1c2128', border: '1px solid #2d3748', borderRadius: '8px', fontSize: '11px' }}
                        labelStyle={{ display: 'none' }}
                    />
                    <Area type="monotone" dataKey="rx" stroke="#22c55e" strokeWidth={2} fill="url(#gradRx)" dot={false} name="RX %" />
                    <Area type="monotone" dataKey="tx" stroke="#00d4ff" strokeWidth={1.5} strokeDasharray="4 4" fill="url(#gradTx)" dot={false} name="TX %" />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
