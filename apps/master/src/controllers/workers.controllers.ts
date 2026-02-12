import { setWorkerStatus, getAllWorkers } from "../services/redi.service";
import { TaskModel } from "../models/task.model";
import { io } from "../master";
import { Request, Response } from "express";

export const AllWorkers = async (req: Request, res: Response) => {
  try {
    const workers = await getAllWorkers();
    res.json(workers);
  } catch (err) {
    res.status(503).json({ error: "Redis unavailable" });
  }
};

export const executeWorker = async (req: Request, res: Response) => {
  try {
    const { command, workerId, cwd, timeout } = req.body;
    if (!workerId || !command) {
      return res
        .status(400)
        .json({ error: "command and workerId are required" });
    }
    const sockets = await io.in(`worker:${workerId}`).fetchSockets();
    if (sockets.length === 0) {
      return res
        .status(404)
        .json({ error: `Worker with id ${workerId} doesn't exist` });
    }

    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await setWorkerStatus(workerId, "BUSY");

    const log = await TaskModel.create({
      taskId,
      workerId,
      command,
      status: "pending",
    });

    io.to(`worker:${workerId}`).emit("TASK_REQUEST", {
      taskId,
      command,
      cwd,
      timeout,
    });

    console.log(`Task ${taskId} dispatched to ${workerId}: ${command}`);
    res.json({ taskId, workerId, status: "PENDING" });
  } catch (err: any) {
    res.status(500).json({ error: `Unexpected error: ${err.message}` });
  }
};

export const executeAll = async (req: Request, res: Response) => {
  try {
    const { command, cwd, timeout } = req.body;
    if (!command) {
      return res.status(400).json({ error: "command is required" });
    }
    const workers = await getAllWorkers();
    if (workers.length === 0) {
      return res.status(404).json({ error: "No available workers" });
    }
    const taskIds: string[] = [];

    for (const worker of workers) {
      const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      taskIds.push(taskId);

      await setWorkerStatus(worker.workerId, "BUSY");

      const log = await TaskModel.create({
        taskId,
        workerId: worker.workerId,
        command,
        status: "pending",
      });
      io.to(`worker:${worker.workerId}`).emit("TASK_REQUEST", {
        taskId,
        command,
        cwd,
        timeout,
      });
      console.log(
        `Task ${taskId} dispatched to ${worker.workerId}: ${command}`,
      );
    }

    res.json({ taskIds, status: "PENDING" });
  } catch (err) {
    res.status(503).json({ error: "Redis unavailable" });
  }
};

export const getLogs = async (req: Request, res: Response) => {
  try {
    const logs = await TaskModel.find().sort({ createdAt: -1 });
    if (!logs) {
      return res.status(404).json({
        message: "No logs found",
      });
    }
    res.status(200).json({
      logs,
    });
  } catch (err: any) {
    console.log(`Error: ${err.message}`);
  }
};

export const getWorkerLogs = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const logs = await TaskModel.find({ workerId: id }).sort({ createdAt: -1 });
    if (!logs) {
      return res.status(404).json({
        message: "No worker found",
      });
    }
    res.status(200).json({
      logs,
    });
  } catch (err: any) {
    console.log(`Error: ${err.message}`);
  }
};
