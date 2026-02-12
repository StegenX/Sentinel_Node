import { spawn, ChildProcess } from "child_process";
import { EventEmitter } from "events";

export interface TaskRequest {
    taskId: string;
    command: string;
    cwd?: string;
    timeout?: number;
}

export interface TaskResult {
    taskId: string;
    exitCode: number | null;
    output: string;
    error: string;
    duration: number;
}

export class CommandExecutor extends EventEmitter {
    private activeProcess: ChildProcess | null = null;
    private defaultTimeout = 300000;

    execute(task: TaskRequest): void {
        const startTime = Date.now();
        let output = '';
        let error = '';

        const parts = task.command.split(' ');
        const cmd = parts[0];
        const args = parts.slice(1);

        console.log(`Executing task ${task.taskId}: ${task.command}`);

        this.activeProcess = spawn(cmd, args, {
            cwd: task.cwd || process.cwd(),
            shell: true,
        });

        const timeout = task.timeout || this.defaultTimeout;
        const timeoutId = setTimeout(() => {
            if (this.activeProcess) {
                console.log(`Task ${task.taskId} timed out`);
                this.activeProcess.kill('SIGTERM');
                
                this.emit('timeout', {
                    taskId: task.taskId,
                    message: 'Process exceeded time limit',
                });
            }
        }, timeout);

        this.activeProcess.stdout?.on('data', (data: Buffer) => {
            const chunk = data.toString();
            output += chunk;
            
            this.emit('chunk', {
                taskId: task.taskId,
                stream: 'stdout',
                data: chunk,
                timestamp: Date.now(),
            });
        });

        this.activeProcess.stderr?.on('data', (data: Buffer) => {
            const chunk = data.toString();
            error += chunk;
            
            this.emit('chunk', {
                taskId: task.taskId,
                stream: 'stderr',
                data: chunk,
                timestamp: Date.now(),
            });
        });

        this.activeProcess.on('close', (code) => {
            clearTimeout(timeoutId);
            const duration = Date.now() - startTime;

            const result: TaskResult = {
                taskId: task.taskId,
                exitCode: code,
                output,
                error,
                duration,
            };

            if (code === 0) {
                this.emit('complete', result);
            } else {
                this.emit('failed', result);
            }

            this.activeProcess = null;
        });

        this.activeProcess.on('error', (err) => {
            clearTimeout(timeoutId);
            const duration = Date.now() - startTime;

            this.emit('failed', {
                taskId: task.taskId,
                exitCode: null,
                output,
                error: err.message,
                duration,
            });

            this.activeProcess = null;
        });
    }

    kill(): boolean {
        if (this.activeProcess) {
            this.activeProcess.kill('SIGTERM');
            return true;
        }
        return false;
    }
}

export const executor = new CommandExecutor();