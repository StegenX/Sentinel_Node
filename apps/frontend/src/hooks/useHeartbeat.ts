import { useState, useEffect, useRef } from 'react';
import socket from '../services/socket';
import type { HeartbeatData, LoadAvgPoint } from '../types';

const MAX_HISTORY = 60; // keep 60 data points (~1 minute at 1s interval)

// Listens to WORKER_HEARTBEAT socket events and maintains a rolling history
// for the Load Average chart. Filters by the currently selected workerId.
export function useHeartbeat(workerId: string | null) {
    const [latest, setLatest] = useState<HeartbeatData | null>(null);
    const [history, setHistory] = useState<LoadAvgPoint[]>([]);
    const workerIdRef = useRef(workerId);

    useEffect(() => {
        workerIdRef.current = workerId;
    }, [workerId]);

    useEffect(() => {
        function onHeartbeat(data: HeartbeatData) {
            // Only process events for the selected worker
            if (workerIdRef.current && data.workerId !== workerIdRef.current) return;

            setLatest(data);

            const point: LoadAvgPoint = {
                time: new Date().toLocaleTimeString('en-US', { hour12: false }),
                load1m: data.loadAvg[0],
                load5m: data.loadAvg[1],
                load15m: data.loadAvg[2],
            };

            setHistory(prev => {
                const next = [...prev, point];
                return next.length > MAX_HISTORY ? next.slice(next.length - MAX_HISTORY) : next;
            });
        }

        socket.on('WORKER_HEARTBEAT', onHeartbeat);
        return () => {
            socket.off('WORKER_HEARTBEAT', onHeartbeat);
        };
    }, []);

    return { latest, history };
}
