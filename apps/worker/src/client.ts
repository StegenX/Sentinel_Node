// TODO: Implement Socket.io-client logic
import { io, Socket } from 'socket.io-client';
import { getSystemMetrics } from './monitor';

const SERVER_URL = 'http://localhost:3000';
const WORKER_ID = 'worker-1';
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
    console.log(`Heartbeat sent: CPU: ${metrics.cpuLoad}%, Mem: ${metrics.freeMemPer}%`);
}

socket.on('connect', () => {
    console.log('Connected to Master Server');

    sendHeartbeat();

    heartbeatTimer = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);
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