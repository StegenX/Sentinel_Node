import blessed from "blessed";
import contrib from "blessed-contrib";
import io from "socket.io-client";
import axios from "axios";
import dotenv from "dotenv";
import os from "os";

dotenv.config();

const SERVER_URL = process.env.SERVER_URL || "http://localhost:3000";

// --- Types ---
interface Worker {
  workerId: string;
  status: "IDLE" | "BUSY" | "OFFLINE";
  metrics?: {
    cpuLoad: number;
    freeMemPercentage: number;
  };
}

// --- UI Setup ---
const screen = blessed.screen({
  smartCSR: true,
  title: "SENTINEL NODE TUI",
});

const grid = new contrib.grid({ rows: 12, cols: 12, screen: screen });

// 1. Network Status (Map/List)
const workerTable = grid.set(0, 0, 6, 4, contrib.table, {
  keys: true,
  fg: "white",
  selectedFg: "white",
  selectedBg: "blue",
  interactive: true,
  label: "Network Nodes",
  width: "30%",
  height: "30%",
  border: { type: "line", fg: "cyan" },
  columnSpacing: 5,
  columnWidth: [20, 10, 10, 10],
});

// 2. Telemetry (CPU Chart)
const cpuLine = grid.set(0, 4, 3, 8, contrib.line, {
  style: { line: "yellow", text: "green", baseline: "black" },
  xLabelPadding: 3,
  xPadding: 5,
  showLegend: true,
  wholeFile: false, // passthrough
  label: "Cluster CPU Load %",
});

// 3. Telemetry (Memory Chart)
const memLine = grid.set(3, 4, 3, 8, contrib.line, {
  style: { line: "magenta", text: "green", baseline: "black" },
  xLabelPadding: 3,
  xPadding: 5,
  showLegend: true,
  label: "Cluster Free Memory %",
});

// 4. Operation Log
const logBox = grid.set(6, 0, 4, 12, contrib.log, {
  fg: "green",
  selectedFg: "green",
  label: "Operation Log (Scroll: Arrows/PgUp/PgDn)",
  keys: true,
  vi: true,
  mouse: true,
  scrollable: true,
  scrollbar: {
    ch: " ",
    inverse: true,
  },
});

// 5. Command Input
const form = grid.set(10, 0, 2, 12, blessed.form, {
  label: "Command Center",
  keys: true,
});

const input = blessed.textbox({
  parent: form,
  name: "input",
  inputOnFocus: true,
  height: 1,
  width: "98%",
  top: 0,
  left: 1,
  style: { fg: "white", bg: "black" },
});

const submitBtn = blessed.button({
  parent: form,
  name: "submit",
  content: "[ SEND ]",
  top: 0,
  right: 1,
  shrink: true,
  style: { bg: "blue", fg: "white", focus: { bg: "red" } },
});

// --- Logic ---
const socket = io(SERVER_URL);
let workers: Worker[] = [];
const cpuData: any = { title: "Avg Load", x: [], y: [] };
const memData: any = { title: "Avg Free", x: [], y: [] };
let tick = 0;

// Helper to refresh table
function updateTable() {
  const data = workers.map((w) => [
    w.workerId,
    w.status,
    w.metrics ? `${w.metrics.cpuLoad}%` : "N/A",
    w.metrics ? `${w.metrics.freeMemPercentage}%` : "N/A",
  ]);
  workerTable.setData({
    headers: ["ID", "Status", "CPU", "Mem"],
    data: data,
  });
}

// Initial Fetch
async function fetchWorkers() {
  try {
    const res = await axios.get(`${SERVER_URL}/api/workers`);
    workers = res.data;
    updateTable();
    logBox.log(`[SYSTEM] Discovered ${workers.length} nodes.`);
  } catch (e: any) {
    logBox.log(`[ERROR] Fetch failed: ${e.message}`);
  }
}

// Socket Events
socket.on("connect", () => {
  logBox.log("[SYSTEM] Connected to Master Node.");
  screen.render();
});

socket.on("WORKER_HEARTBEAT", (data: any) => {
  // Update local state
  const idx = workers.findIndex((w) => w.workerId === data.workerId);
  if (idx >= 0) {
    workers[idx].metrics = {
      cpuLoad: data.cpuLoad,
      freeMemPercentage: data.freeMemPercentage,
    };
    if (data.status) workers[idx].status = data.status; // Optional status update
  } else {
    workers.push({
      workerId: data.workerId,
      status: "IDLE",
      metrics: {
        cpuLoad: data.cpuLoad,
        freeMemPercentage: data.freeMemPercentage,
      },
    });
  }
  updateTable();

  // Update Charts (Average of all workers for simplicity)
  const avgCpu =
    workers.reduce((acc, w) => acc + (w.metrics?.cpuLoad || 0), 0) /
    (workers.length || 1);
  const avgMem =
    workers.reduce((acc, w) => acc + (w.metrics?.freeMemPercentage || 0), 0) /
    (workers.length || 1);

  const timeLabel = new Date().toLocaleTimeString();

  // Add data point
  cpuData.x.push(timeLabel);
  cpuData.y.push(avgCpu);
  if (cpuData.x.length > 20) {
    cpuData.x.shift();
    cpuData.y.shift();
  }

  memData.x.push(timeLabel);
  memData.y.push(avgMem);
  if (memData.x.length > 20) {
    memData.x.shift();
    memData.y.shift();
  }

  cpuLine.setData([cpuData]);
  memLine.setData([memData]);

  screen.render();
});

socket.on("TASK_FINISHED", (data: any) => {
  const status = data.exitCode === 0 ? "COMPLETED" : "FAILED";
  const color = data.exitCode === 0 ? "{green-fg}" : "{red-fg}";
  logBox.log(
    `${color}[TASK] ${data.taskId} ${status} (Exit: ${data.exitCode}){/}`,
  );
  screen.render();
});

socket.on("STREAM_CHUNK", (data: any) => {
  const prefix =
    data.stream === "stderr" ? "{red-fg}[STDERR]" : "{cyan-fg}[STDOUT]";
  logBox.log(` ${prefix} ${data.data.trim()}{/}`);
  screen.render();
});

// Command Input Handler
input.key("enter", async () => {
  const cmd = input.getValue();
  input.clearValue();
  input.focus();

  // Simple parsing: "target_id command" or just "command" (broadcast?)
  // For now, let's just pick the first worker or require syntax
  // Let's implement broadcast for simplicity in TUI v1
  if (!cmd.trim()) return;

  logBox.log(`{yellow-fg}[CMD] Executing: ${cmd}{/}`);
  screen.render();

  // Pick first available worker
  const target = workers[0];
  if (!target) {
    logBox.log(`{red-fg}[ERROR] No workers available.{/}`);
    return;
  }

  try {
    const res = await axios.post(`${SERVER_URL}/api/execute`, {
      workerId: target.workerId,
      command: cmd,
    });
    const taskId = res.data.taskId;
    socket.emit("JOIN_TASK", taskId);
    logBox.log(`{green-fg}[SYSTEM] Watching task: ${taskId}{/}`);
  } catch (e: any) {
    logBox.log(`{red-fg}[ERROR] Cmd failed: ${e.message}{/}`);
  }
});

// Initialization
screen.key(["escape", "q", "C-c"], () => process.exit(0));
input.focus();
fetchWorkers();
screen.render();
