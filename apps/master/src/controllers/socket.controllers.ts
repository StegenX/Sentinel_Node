import { io } from "../master";
import { setWorkerStatus, setWorkerMetrics } from "../services/redi.service";
import { TaskModel } from '../models/task.model';
import { Socket } from 'socket.io';

interface HeartbeatInf {
  workerId: string;
  cpuLoad: number;
  freeMemPercentage: number;
}

interface TaskResult {
  taskId: string;
  exitCode: number | null;
  output: string;
  error: string;
  duration: number;
}


export const heartBeat = async (data: HeartbeatInf) => {
  console.log(
    `Heartbeat from ${data.workerId}: CPU ${data.cpuLoad}%, Mem ${data.freeMemPercentage}%`,
  );
  await setWorkerMetrics(data.workerId, {
    cpuLoad: data.cpuLoad as number,
    freeMemPercentage: data.freeMemPercentage as number,
  });
};

export const taskOutput = (data: TaskResult, socket: Socket) => {
  socket.to(`task:${data.taskId}`).emit("STREAM_CHUNK", data);
};

export const setTaskComplete = async (result: TaskResult, workerId: string) => {
  console.log(
    `Task ${result.taskId} completed (exit: ${result.exitCode}, duration: ${result.duration}ms)`,
  );
  await setWorkerStatus(workerId, "IDLE");
  await TaskModel.findOneAndUpdate(
    { taskId: result.taskId },
    {
      status: "completed",
      result: {
        exitCode: result.exitCode,
        duration: result.duration,
        fullOutput: result.output,
      },
    },
  );
  io.to(`task:${result.taskId}`).emit("TASK_FINISHED", result);
};

export const setTaskFailed = async (result: TaskResult, workerId: string) => {
  console.log(
    `Task ${result.taskId} failed (exit: ${result.exitCode}): ${result.error}`,
  );
  await setWorkerStatus(workerId as string, "IDLE");
  await TaskModel.findOneAndUpdate(
    { taskId: result.taskId },
    {
      status: "failed",
      result: {
        exitCode: result.exitCode,
        fullOutput: result.output,
        duration: result.duration,
      },
    },
  );
  io.to(`task:${result.taskId}`).emit("TASK_FINISHED", result);
};

export const onDisconnection = async (workerId: string) => {
  console.log(`Connection ended: ${workerId} has been disconnected`);

  await setWorkerStatus(workerId as string, "OFFLINE");
  await TaskModel.updateMany(
    { workerId, status: "pending" },
    { status: "failed", "result.error": "Worker disconnected unexpectedly" },
  );
};
