import { io, Socket } from "socket.io-client";
import { getSystemMetrics } from "./monitor";
import { executor, TaskRequest } from "./executor";
import fs from "fs";
import crypto from "crypto";

const workerId = process.env.MACHINE_ID;
const secret = process.env.SECRET_TOKEN as string;
const timestamp = Date.now().toString();
const HEARTBEAT_INTERVAL = 1000;

const signature = crypto
  .createHmac("sha256", secret)
  .update(workerId + timestamp)
  .digest("hex");

console.log(`Connecting to ${process.env.SERVER_URL} as ${workerId}...`);

const socket: Socket = io(process.env.SERVER_URL, {
  query: {
    workerId,
    timestamp,
    signature,
  },
});

let heartbeatTimer: NodeJS.Timeout | null = null;

function sendHeartbeat(): void {
  const metrics = getSystemMetrics();
  socket.emit("HEARTBEAT", {
    workerId: workerId,
    ...metrics,
  });
  console.log(
    `Heartbeat sent: CPU: ${metrics.cpuLoad}%, Mem: ${metrics.freeMemPercentage}%`,
  );
}

executor.on("chunk", (data) => {
  socket.emit("STREAM_CHUNK", data);
});

executor.on("complete", (result) => {
  console.log(`Task ${result.taskId} completed in ${result.duration}ms`);
  socket.emit("TASK_COMPLETE", result);
});

executor.on("failed", (result) => {
  if (result.exitCode === null) {
    console.log(`Task ${result.taskId} failed: ${result.error}`);
  } else {
    console.log(`Task ${result.taskId} exited with status ${result.exitCode}`);
  }
  socket.emit("TASK_FAILED", result);
});

executor.on("timeout", (err) => {
  console.log(`Task ${err.taskId} timed out`);
  socket.emit("TASK_FAILED", {
    taskId: err.taskId,
    exitCode: 124,
    output: "",
    error: err.message,
    duration: 0,
  });
});

socket.on("connect", () => {
  console.log("Connected to Master Server");

  sendHeartbeat();

  heartbeatTimer = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);
});

socket.on("TASK_REQUEST", (data: TaskRequest) => {
  console.log(`Recived Task ${data.taskId}`);
  executor.execute(data);
});

socket.on("STREAM_CHUNK", (data) => {
  console.log(`[${data.taskId}] ${data.stream}: ${data.data.trim()}`);
});

socket.on("disconnect", () => {
  console.log("Disconnected from Master Server");

  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
});

socket.on("connect_error", (err) => {
  console.error(`Connection error: ${err.message}`);
});
