import { useState, useEffect, useRef } from 'react';
import { useWorkers } from '../hooks/useWorkers';
import { fetchWorkerLogs, executeCommand } from '../services/api';
import socket from '../services/socket';
import type { TaskLog, StreamChunk } from '../types';

export default function Logs() {
    const { workers } = useWorkers();
    const [selectedWorker, setSelectedWorker] = useState<string>('');
    const [logs, setLogs] = useState<TaskLog[]>([]);
    const [command, setCommand] = useState('');
    const [terminal, setTerminal] = useState<string[]>([]);
    const [running, setRunning] = useState(false);
    const terminalRef = useRef<HTMLDivElement>(null);
    const activeTaskId = useRef<string | null>(null);  // track current task

    // Auto-select first worker
    useEffect(() => {
        if (workers.length > 0 && !selectedWorker) {
            setSelectedWorker(workers[0].workerId);
        }
    }, [workers, selectedWorker]);

    // Load task history when worker changes
    useEffect(() => {
        if (!selectedWorker) return;
        fetchWorkerLogs(selectedWorker)
            .then(setLogs)
            .catch(() => setLogs([]));
    }, [selectedWorker]);

    // Listen for live stream chunks and task completion
    useEffect(() => {
        function onChunk(data: StreamChunk) {
            // Ignore chunks from other tasks (global broadcast)
            if (data.taskId !== activeTaskId.current) return;
            const prefix = data.stream === 'stderr' ? '[ERR] ' : '';
            setTerminal(prev => [...prev, prefix + data.data]);
        }
        function onFinished(result: any) {
            // Ignore events from other tasks
            if (result.taskId !== activeTaskId.current) return;
            setTerminal(prev => [
                ...prev,
                `\n--- Task finished (exit: ${result.exitCode}, ${result.duration}ms) ---`,
            ]);
            setRunning(false);
            activeTaskId.current = null;
            // Refresh logs
            if (selectedWorker) {
                fetchWorkerLogs(selectedWorker).then(setLogs).catch(() => { });
            }
        }
        socket.on('STREAM_CHUNK', onChunk);
        socket.on('TASK_FINISHED', onFinished);
        return () => {
            socket.off('STREAM_CHUNK', onChunk);
            socket.off('TASK_FINISHED', onFinished);
        };
    }, [selectedWorker]);

    // Auto-scroll terminal
    useEffect(() => {
        if (terminalRef.current) {
            terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
    }, [terminal]);

    async function handleExecute(e: React.FormEvent) {
        e.preventDefault();
        if (!selectedWorker || !command.trim()) return;
        setTerminal([`$ ${command}`]);
        setRunning(true);
        try {
            const { taskId } = await executeCommand(selectedWorker, command);
            activeTaskId.current = taskId;   // store before joining room
            socket.emit('JOIN_TASK', taskId);
        } catch (err: any) {
            setTerminal(prev => [...prev, `Error: ${err.message}`]);
            setRunning(false);
        }
    }

    function statusClass(status: string) {
        if (status === 'completed') return 'status-completed';
        if (status === 'failed') return 'status-failed';
        return 'status-pending';
    }

    return (
        <div className="page-content">
            <div className="logs-header">
                <h2 className="logs-title">Task Logs</h2>
                <select
                    className="worker-select"
                    value={selectedWorker}
                    onChange={e => setSelectedWorker(e.target.value)}
                >
                    {workers.map(w => (
                        <option key={w.workerId} value={w.workerId}>{w.workerId}</option>
                    ))}
                </select>
            </div>

            {/* Execute command form */}
            <form className="execute-form" onSubmit={handleExecute}>
                <input
                    className="execute-input"
                    type="text"
                    placeholder="Enter command (e.g. ls -la)"
                    value={command}
                    onChange={e => setCommand(e.target.value)}
                    disabled={running}
                />
                <button className="execute-btn" type="submit" disabled={running || !selectedWorker}>
                    {running ? 'Running…' : '▶ Execute'}
                </button>
            </form>

            {/* Live terminal output */}
            {terminal.length > 0 && (
                <div className="terminal" ref={terminalRef}>
                    {terminal.map((line, i) => (
                        <div key={i} className={`terminal-line ${line.startsWith('[ERR]') ? 'err' : ''}`}>
                            {line}
                        </div>
                    ))}
                    {running && <div className="terminal-cursor">▌</div>}
                </div>
            )}

            {/* Task history table */}
            <div className="logs-table-wrapper">
                <table className="logs-table">
                    <thead>
                        <tr>
                            <th>Command</th>
                            <th>Status</th>
                            <th>Exit</th>
                            <th>Duration</th>
                            <th>Created</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.length === 0 && (
                            <tr><td colSpan={5} className="no-logs">No task history found.</td></tr>
                        )}
                        {logs.map(log => (
                            <tr key={log._id}>
                                <td className="log-command">{log.command}</td>
                                <td><span className={`status-badge ${statusClass(log.status)}`}>{log.status}</span></td>
                                <td>{log.result?.exitCode ?? '—'}</td>
                                <td>{log.result?.duration ? `${log.result.duration}ms` : '—'}</td>
                                <td>{new Date(log.createdAt).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
