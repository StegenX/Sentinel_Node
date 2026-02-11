// TODO: Implement OS metrics logic (os-utils)
import os from 'os';

export interface SystemMetrics {
    cpuLoad: number,
    freeMemPercentage: number,
}

export function getSystemMetrics(): SystemMetrics {
    const cpus = os.cpus();

    let totalIdle = 0;
    let totalTick = 0;

    for (const cpu of cpus) {
        for (const type in cpu.times) {
            totalTick += cpu.times[type as keyof typeof cpu.times];
        }
        totalIdle += cpu.times.idle;
    }

    const cpuLoad = 100 - (totalIdle / totalTick) * 100;


    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const freeMemPercentage = (freeMem / totalMem) * 100;

    return {
        cpuLoad: Math.round(cpuLoad * 10) / 10,
        freeMemPercentage: Math.round(freeMemPercentage * 10) / 10,
    }
}