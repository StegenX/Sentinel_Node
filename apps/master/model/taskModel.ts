import { Command } from "ioredis";
import mongoose from "mongoose";


const taskSchema = new mongoose.Schema({
    taskId: {
        type: String,
        required: true,
    },
    workerId: {
        type: String,
        required: true,
    },
    command: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['completed', 'failed', 'pending'],
        default: 'pending',
    },
});