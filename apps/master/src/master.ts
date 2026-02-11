import express, { type Express } from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import {    
    setWorkerStatus, 
    setWorkerMetrics, 
    getWorkerStatus,
    getAllWorkers
} from './rediService'
import { TaskModel } from './taskModel';
import { connectToDatabase } from './db';

interface HandshakeQuery {
    workerId: string,
    token: string,
}



const app: Express = express();
app.use(express.json());
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: '*',
    }
});


connectToDatabase();


app.get('/workers', async (req, res) => {
    try {
        const workers = await getAllWorkers();
        res.json(workers);
    }catch(err) {
        res.status(503).json({error: 'Redis unavailable'})
    }
});

app.post('/api/execute', async (req, res) => {
    try {
        const { command, workerId, cwd, timeout } = req.body;
        if (!workerId || !command) {
            return res.status(400).json({ error: 'command and workerId are required' });
        }
        const sockets = await io.in(`worker:${workerId}`).fetchSockets();
        if (sockets.length === 0) {
            return res.status(404).json({ error: `Worker with id ${workerId} doesn't exist` });
        }

        const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        await setWorkerStatus(workerId, 'BUSY');

        const log = await TaskModel.create({
            taskId,
            workerId,
            command,
            status: 'pending',
        });

        io.to(`worker:${workerId}`).emit('TASK_REQUEST', {
            taskId,
            command,
            cwd,
            timeout,
        });

        console.log(`Task ${taskId} dispatched to ${workerId}: ${command}`);
        res.json({ taskId, workerId, status: 'PENDING' });
    }catch(err) {

    }
})

app.post('/api/execute/all', async (req, res) => {
    try {
        const { command, cwd, timeout } = req.body;
        if (!command) {
            return res.status(400).json({ error: 'command is required' });
        }
        const workers = await getAllWorkers();
        if (workers.length === 0) {
            return res.status(404).json({ error: 'No available workers' });
        }
        const taskIds: string[] = [];

        for (const worker of workers) {
            const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            taskIds.push(taskId);

            await setWorkerStatus(worker.workerId, 'BUSY');

            const log = await TaskModel.create({
                taskId,
                workerId: worker.workerId,
                command,
                status: 'pending',
            });;
            io.to(`worker:${worker.workerId}`).emit('TASK_REQUEST', {
                taskId,
                command,
                cwd,
                timeout,
            });
            console.log(`Task ${taskId} dispatched to ${worker.workerId}: ${command}`);
        }

        res.json({ taskIds, status: 'PENDING' });
    }catch(err) {
            res.status(503).json({error: 'Redis unavailable'})
        }
})

app.get('/api/logs', async (req, res) => {
    try {
        const logs = await TaskModel.find().sort( { createdAt: -1 } );
        if (!logs) {
            return res.status(404).json({
                message: 'No logs found',
            });
        }
        res.status(200).json({
            logs,
        });
    }catch(err: any) {
        console.log(`Error: ${err.message}`);
    }
});

app.get('/api/logs/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const logs = await TaskModel.find({ workerId: id }).sort( { createdAt: -1 } );
        if (!logs) {
            return res.status(404).json({
                message: 'No worker found',
            });
        }
        res.status(200).json({
            logs,
        });
    }catch(err: any) {
        console.log(`Error: ${err.message}`);
    }
});


io.on('connection', async (socket) => {
    const { workerId, token } = socket.handshake.query as unknown as HandshakeQuery;
    if (!workerId || !token) {
        console.log('Connection Refused: invalid handshake');
        socket.disconnect();
        return;
    }

    socket.join(`worker:${workerId}`);
    console.log(`Connection Established: ${workerId} has been connected`);

    await setWorkerStatus(workerId as string, 'IDLE');
    
    socket.on('HEARTBEAT', async (data) => {
        console.log(`Heartbeat from ${data.workerId}: CPU ${data.cpuLoad}%, Mem ${data.freeMemPercentage}%`);
        await setWorkerMetrics(data.workerId, {
            cpuLoad: data.cpuLoad as number,
            freeMemPercentage: data.freeMemPercentage as number,

        });
    });

    socket.on('JOIN_TASK', (taskId) => {
        socket.join(`task:${taskId}`);
        console.log(`Socket ${socket.id} is now watching ${taskId}`);
    })

    socket.on('STREAM_CHUNK', (data) => {
        socket.to(`task:${data.taskId}`).emit('STREAM_CHUNK', data);
    });

    socket.on('TASK_COMPLETE', async (result) => {
        console.log(`Task ${result.taskId} completed (exit: ${result.exitCode}, duration: ${result.duration}ms)`);
        await setWorkerStatus(workerId as string, 'IDLE');
        await TaskModel.findOneAndUpdate({ taskId: result.taskId }, {
            status: 'completed',
            result: {
                exitCode: result.exitCode,
                duration: result.duration,
                fullOutput: result.fullOutput,
            }
        });
        io.to(`task:${result.taskId}`).emit('TASK_FINISHED', result);    
    });

        socket.on('TASK_FAILED', async (result) => {
        console.log(`Task ${result.taskId} failed (exit: ${result.exitCode}): ${result.error}`);
        await setWorkerStatus(workerId as string, 'IDLE');
        await TaskModel.findOneAndUpdate({ taskId: result.taskId }, {
            status: 'failed',
            result: {
                exitCode: result.exitCode,
                fullOutput: result.fullOutput,
                duration: result.duration,
            }
        });
        io.to(`task:${result.taskId}`).emit('TASK_FINISHED', result);
    });

    socket.on('disconnect', async () => {
        console.log(`Connection ended: ${workerId} has been disconnected`);

        await setWorkerStatus(workerId as string, 'OFFLINE');
    });
})


server.listen(3000, () => {
    console.log("Hello There");
})