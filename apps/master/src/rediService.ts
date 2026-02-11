import Redis  from "ioredis";

const redis = new Redis({
    host: 'localhost',
    port: parseInt('6379'),
});

redis.on('connect', () => {
    console.log('Connected to Redis');
});

redis.on('error', (err) => {
    console.log(`Redis Connection error : ${err.message}`);
});

export async function setWorkerStatus(workerId: string, status: 'IDLE' | 'BUSY' | 'OFFLINE') : Promise<void> {
    await redis.set(`worker:${workerId}:status`, status);
}

export async function getWorkerStatus(workerId: string): Promise<string | null> {
    return await redis.get(`worker:${workerId}:status`);
}

export async function setWorkerMetrics(workerId: string, metrics: { cpuLoad: number; freeMemPercentage: number }): Promise<void> {
    await redis.set(
        `worker:${workerId}:metrics`,
        JSON.stringify(metrics),
        'EX',
        60
    );
}

export async function getWorkerMetrics(workerId: string): Promise<{ cpuLoad: number; freeMemPercentage: number } | null> {
    const data = await redis.get(`worker:${workerId}:metrics`);
    return data ? JSON.parse(data) : null;
}

export async function getAllWorkers(): Promise<Array<{ workerId: string; status: string | null; metrics: any }>> {
    const keys = await redis.keys('worker:*:status');
    const workers = [];

    for (const key of keys) {
        const workerId = key.split(':')[1];
        const status = await getWorkerStatus(workerId);
        const metrics = await getWorkerMetrics(workerId);
        if (status !== 'OFFLINE') {
            workers.push({ workerId, status, metrics });
        }
    }

    return workers;
}

export async function removeWorker(workerId: string): Promise<void> {
    await redis.del(`worker:${workerId}:status`);
    await redis.del(`worker:${workerId}:metrics`);
}

export default redis;