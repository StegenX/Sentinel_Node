import { useState, useEffect } from 'react';
import { fetchWorkers } from '../services/api';
import type { Worker } from '../types';

// Polls GET /api/workers every 5 seconds to keep the worker list fresh
export function useWorkers() {
    const [workers, setWorkers] = useState<Worker[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {
                const data = await fetchWorkers();
                if (!cancelled) {
                    setWorkers(data);
                    setError(null);
                }
            } catch (err: any) {
                if (!cancelled) setError(err.message);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        load();
        const interval = setInterval(load, 5000);
        return () => {
            cancelled = true;
            clearInterval(interval);
        };
    }, []);

    return { workers, loading, error };
}
