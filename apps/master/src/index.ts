import express, { type Express } from 'express';
import http from 'http';
import { Server } from 'socket.io';

interface HandshakeQuery {
    workerId: string,
    token: string,
}

const app: Express = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: '*',
    }
});

app.get('/', (req, res) => {
    res.send('Hello World!');
});

io.on('connection', (socket) => {
    const { workerId, token } = socket.handshake.query as unknown as HandshakeQuery;
    if (!workerId || !token) {
        console.log('Connection Refused: invalid handshake');
        socket.disconnect();
        return;
    }

    console.log(`Connection Established: ${workerId} has been connected`);

    socket.on('HEARTHBEAT', (data) => {
        console.log(`Heartbeat from ${data.workerId}: CPU ${data.cpuLoad}%, Mem ${data.freeMemPer}%`);
    });

    socket.on('disconnect', () => {
        console.log(`Connection ended: ${workerId} has been disconnected`);
    });
})


server.listen(3000, () => {
    console.log("Hello There");
})