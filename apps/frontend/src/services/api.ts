import axios from 'axios';
import type { Worker, TaskLog } from '../types';


const MASTER_URL = import.meta.env.VITE_MASTER_URL || 'http://localhost:3000';

const api = axios.create({ baseURL: `${MASTER_URL}/api` });

// GET /api/workers — returns all online workers with status + basic metrics
export async function fetchWorkers(): Promise<Worker[]> {
    const { data } = await api.get<Worker[]>('/workers');
    return data;
}

// GET /api/logs/:workerId — returns task history for a specific worker
export async function fetchWorkerLogs(workerId: string): Promise<TaskLog[]> {
    const { data } = await api.get<{ logs: TaskLog[] }>(`/logs/${workerId}`);
    return data.logs;
}

// POST /api/execute — dispatch a command to a specific worker
export async function executeCommand(
    workerId: string,
    command: string,
    cwd?: string,
    timeout?: number
): Promise<{ taskId: string; workerId: string; status: string }> {
    const { data } = await api.post('/execute', { workerId, command, cwd, timeout });
    return data;
}
