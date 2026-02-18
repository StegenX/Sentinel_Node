import { useEffect, useState } from 'react';
import { useWorkers } from '../hooks/useWorkers';
import { useHeartbeat } from '../hooks/useHeartbeat';
import Header from '../components/Header';
import CpuCard from '../components/CpuCard';
import MemoryCard from '../components/MemoryCard';
import UptimeCard from '../components/UptimeCard';
import LoadAvgChart from '../components/LoadAvgChart';
import DiskCard from '../components/DiskCard';
import NetworkCard from '../components/NetworkCard';

export default function Dashboard() {
    const { workers } = useWorkers();
    const [selectedWorker, setSelectedWorker] = useState<string | null>(null);

    // Auto-select the first worker when the list loads
    useEffect(() => {
        if (workers.length > 0 && !selectedWorker) {
            setSelectedWorker(workers[0].workerId);
        }
    }, [workers, selectedWorker]);

    const { latest, history } = useHeartbeat(selectedWorker);

    return (
        <div className="page-content">
            <Header
                selectedWorker={selectedWorker}
                workers={workers}
                onSelectWorker={setSelectedWorker}
            />

            {/* Top metric cards */}
            <div className="metrics-grid">
                <CpuCard
                    cpuLoad={latest?.cpuLoad ?? 0}
                    coreCount={navigator.hardwareConcurrency || 8}
                />
                <MemoryCard freeMemPercentage={latest?.freeMemPercentage ?? 100} />
                <UptimeCard uptime={latest?.uptime ?? null} />
            </div>

            {/* Load average chart */}
            <LoadAvgChart history={history} coreCount={navigator.hardwareConcurrency || 4} />

            {/* Bottom row */}
            <div className="bottom-grid">
                <DiskCard diskUsage={latest?.diskUsage ?? null} />
                <NetworkCard networkTraffic={latest?.networkTraffic ?? null} />
            </div>
        </div>
    );
}
