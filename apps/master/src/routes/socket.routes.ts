import { Socket } from "socket.io";
import {
  heartBeat,
  taskOutput,
  setTaskComplete,
  setTaskFailed,
  onDisconnection,
} from "../controllers/socket.controllers";

export const socketRoutes = (socket: Socket) => {
  socket.on("HEARTBEAT", heartBeat);

  socket.on("JOIN_TASK", (taskId) => {
    socket.join(`task:${taskId}`);
    console.log(`Socket ${socket.id} is now watching ${taskId}`);
  });

  socket.on("STREAM_CHUNK", (data) => taskOutput(data, socket));

  socket.on("TASK_COMPLETE", setTaskComplete);

  socket.on("TASK_FAILED", setTaskFailed);

  socket.on("disconnect", onDisconnection);
};
