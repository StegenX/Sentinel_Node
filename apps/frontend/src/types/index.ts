// Matches the HeartbeatInf interface in socket.controllers.ts
export interface HeartbeatData {
    workerId: string;
    cpuLoad: number;           // 0–100 %
    freeMemPercentage: number; // 0–100 % free RAM
    loadAvg: number[];         // [1m, 5m, 15m]
    diskUsage: {
        size: number;            // GB total
        used: number;            // GB used
        usedPercentage: number;  // 0–100
    };
    networkTraffic: {
        recived: number;         // % share of total traffic
        transmitted: number;
    };
    uptime: {
        days: number;
        hours: number;
        minutes: number;
        seconds: number;
    };
}

// Matches GET /api/workers response
export interface Worker {
    workerId: string;
    status: 'IDLE' | 'BUSY' | 'OFFLINE';
    metrics: {
        cpuLoad: number;
        freeMemPercentage: number;
    } | null;
}

// Matches TaskModel in task.model.ts
export interface TaskLog {
    _id: string;
    taskId: string;
    workerId: string;
    command: string;
    status: 'completed' | 'failed' | 'pending';
    result?: {
        exitCode: number;
        duration: number;
        fullOutput: string;
    };
    createdAt: string;
}

// Stream chunk from STREAM_CHUNK socket event
export interface StreamChunk {
    taskId: string;
    stream: 'stdout' | 'stderr';
    data: string;
    timestamp: number;
}

// Load average history point for the chart
export interface LoadAvgPoint {
    time: string;
    load1m: number;
    load5m: number;
    load15m: number;
}
