import express, { type Express } from 'express';
import http from 'http';
import { Server } from 'socket.io';

interface HandShakeQuery {
    workerId: string,
    token: string,
}

const app: Express = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

io.on('connection', (socket) => {
    const { workerId, token } = socket.handshake.query as unknown as HandShakeQuery;
    
    if (!workerId || !token) {
        console.log('Connection rejected: Missing credentials.');
        socket.disconnect();
        return;
    }
    console.log(`Worker ${workerId} connected successfully.`);
    socket.on('disconnect', () => {
        console.log(`Worker ${workerId} disconnected.`);
    });
})

server.listen(3000, () => {
    console.log("Hi There!!");
})