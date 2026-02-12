import mongoose, { Schema, Document } from "mongoose";

export interface ITask extends Document {
  taskId: string;
  workerId: string;
  command: string;
  status: "completed" | "failed" | "pending";
  result?: {
    exitCode: number;
    duration: number;
    fullOutput: string;
  };
  createdAt: Date;
}
// {
//   "taskId": "task_1707640000",
//   "workerId": "worker-1",
//   "command": "gcc main.c",
//   "status": "COMPLETED",
//   "result": {
//     "exitCode": 0,
//     "duration": 1240,
//     "fullOutput": "..."
//   },
//   "createdAt": "2026-02-11T06:40:30Z"
// }

const taskSchema = new mongoose.Schema({
  taskId: {
    type: String,
    required: true,
  },
  workerId: {
    type: String,
    required: true,
    index: true,
  },
  command: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["completed", "failed", "pending"],
    default: "pending",
  },
  result: {
    exitCode: Number,
    duration: Number,
    fullOutput: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const TaskModel = mongoose.model<ITask>("Task", taskSchema);
