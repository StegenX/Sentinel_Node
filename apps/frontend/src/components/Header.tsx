import type { Worker } from '../types';

interface HeaderProps {
    selectedWorker: string | null;
    workers: Worker[];
    onSelectWorker: (id: string) => void;
}

export default function Header({ selectedWorker, workers, onSelectWorker }: HeaderProps) {
    const worker = workers.find(w => w.workerId === selectedWorker);
    const statusColor = worker?.status === 'BUSY' ? '#f59e0b' : '#22c55e';

    return (
        <header className="dashboard-header">
            <div className="header-left">
                <h1 className="header-title">
                    System Overview
                    <span className="header-divider">|</span>
                    <select
                        className="worker-select"
                        value={selectedWorker || ''}
                        onChange={e => onSelectWorker(e.target.value)}
                    >
                        {workers.length === 0 && <option value="">No workers online</option>}
                        {workers.map(w => (
                            <option key={w.workerId} value={w.workerId}>
                                {w.workerId}
                            </option>
                        ))}
                    </select>
                </h1>
                <p className="header-subtitle">
                    <span className="live-dot" style={{ background: statusColor }} />
                    {worker ? `Status: ${worker.status}` : 'Waiting for worker…'}
                </p>
            </div>
        </header>
    );
}
