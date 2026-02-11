// TODO: Implement Socket.io-client logic
import { io, Socket } from 'socket.io-client';
import { getSystemMetrics } from './monitor';
import { executor, TaskRequest } from './executor';
import { error } from 'console';

const SERVER_URL = 'http://localhost:3000';
const WORKER_ID = '2';
const TOKEN = 'secret-token';
const HEARTBEAT_INTERVAL= 30000;


console.log(`Connecting to ${SERVER_URL} as ${WORKER_ID}...`);

const socket: Socket = io(SERVER_URL, {
    query: {
        workerId: WORKER_ID,
        token: TOKEN,
    }
});

let heartbeatTimer: NodeJS.Timeout | null = null;

function sendHeartbeat (): void {
    const metrics = getSystemMetrics();
    socket.emit('HEARTBEAT', {
        workerId: WORKER_ID,
        ...metrics,
    });
    console.log(`Heartbeat sent: CPU: ${metrics.cpuLoad}%, Mem: ${metrics.freeMemPercentage}%`);
}

executor.on('chunk', (data) => {
    socket.emit('STREAM_CHUNK', data);
});

executor.on('complete', (result) => {
    console.log(`Task ${result.taskId} completed in ${result.duration}ms`);
    socket.emit('TASK_COMPLETE', result);
});

executor.on('faild', (result) => {
    if (result.exitCode === null) {
        console.log(`Task ${result.taskId} faild: ${result.error}`);
    } else {
        console.log(`Task ${result.taskId} exited with status ${result.exitCode}`);
    }
    socket.emit('TASK_FAILED', result);
});

executor.on('timeout', (err) => {
    console.log(`Task ${err.taskId} timed out`);
    socket.emit('TASK_FAILED', {
        taskId: err.taskId,
        exitCode: 124,
        output: '',
        error: err.message,
        duration: 0,
    })
})

socket.on('connect', () => {
    console.log('Connected to Master Server');

    sendHeartbeat();

    heartbeatTimer = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);
});

socket.on('TASK_REQUEST', (data: TaskRequest) => {
    console.log(`Recived Task ${data.taskId}`);
    executor.execute(data);
})

socket.on('STREAM_CHUNK', (data) => {
    console.log(`[${data.taskId}] ${data.stream}: ${data.data.trim()}`);
});

socket.on('disconnect', () => {
    console.log('Disconnected from Master Server');

    if (heartbeatTimer) {
        clearInterval(heartbeatTimer);
        heartbeatTimer = null;
    }
});

socket.on('connect_error', (err) => {
    console.error(`Connection error: ${err.message}`);
});