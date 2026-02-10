import express, { Express } from 'express';
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

server.listen(3000 , (req, res) => {
    console.log("Hi There!!");
})