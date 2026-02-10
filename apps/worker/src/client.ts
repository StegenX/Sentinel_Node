// TODO: Implement Socket.io-client logic
import { io, Socket } from 'socket.io-client';

const SERVER_URL = 'http://localhost:3000';
const WORKER_ID = 'worker-1';
const TOKEN = 'secret-token';

console.log(`Connecting to ${SERVER_URL} as ${WORKER_ID}...`);

const socket: Socket = io(SERVER_URL, {
    query: {
        workerId: WORKER_ID,
        token: TOKEN,
    }
});

socket.on('connect', () => {
    console.log('Connected to Master Server');
});

socket.on('disconnect', () => {
    console.log('Disconnected from Master Server');
});

socket.on('connect_error', (err) => {
    console.error(`Connection error: ${err.message}`);
});