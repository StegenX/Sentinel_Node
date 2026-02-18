import { promises } from "dns";
import os from "os";
import si from "systeminformation";

export interface SystemMetrics {
  cpuLoad: number;
  freeMemPercentage: number;
  loadAvg: number[];
  diskUsage: {
    size: number;
    used: number;
    usedPercentage: number;
  };
  networkTraffic: {
    recived: number;
    transmitted: number;
  };
  uptime: {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  };
}

type NetworkStatData = si.Systeminformation.NetworkStatsData | undefined;
type DiskInfo = si.Systeminformation.FsSizeData | undefined;



const getCpuLoad = (): number => {
  const cpus = os.cpus();

  let totalIdle = 0;
  let totalTick = 0;

  for (const cpu of cpus) {
    for (const type in cpu.times) {
      totalTick += cpu.times[type as keyof typeof cpu.times];
    }
    totalIdle += cpu.times.idle;
  }

  return 100 - (totalIdle / totalTick) * 100;
};

const getFreeMem = (): number => {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  return (freeMem / totalMem) * 100;
};

const getLoadAvg = (): number[] => {
  const loadavg = os.loadavg();
  return loadavg;
};

const getDiskUsage = async () => {
  try {
    const disk: DiskInfo = await si
      .fsSize()
      .then((disks) => disks.find((d) => d.mount === "/"));
    if (disk === undefined) {
      return {
      size: 0,
      used: 0,
      usedPercentage: 0,
    };
    }
    const size = disk.size / Math.pow(1024, 3);
    const used = disk.used / Math.pow(1024, 3);
    const usedPercentage = disk.use;
    return {
      size: Math.round(size),
      used: Math.round(used),
      usedPercentage: Math.round(usedPercentage),
    };
  } catch (err: any) {
    console.log("Disk info retriving Error : " + err.message);
    return {
      size: 0,
      used: 0,
      usedPercentage: 0,
    };
  }
};

const getNetworkTraffic = async () => {
  try {
    const networkStat: NetworkStatData = await si
      .networkStats()
      .then((states) => states.find((stat) => stat.iface === "wlp2s0"));
    if (networkStat === undefined) {
      return {
        recived: 0,
        transmitted: 0,
      };
    }
    const recived = (networkStat?.rx_bytes * 8) / Math.pow(1024, 3);
    const transmitted = (networkStat.tx_bytes * 8) / Math.pow(1024, 3);
    const total = recived + transmitted;
    const recivedPercentage = (recived / total) * 100;
    const transmittedPercentage = (transmitted / total) * 100;
    return {
      recived: Math.round(recivedPercentage),
      transmitted: Math.round(transmittedPercentage),
    };
  } catch (err: any) {
    console.log("Retriving Network stat error: " + err.message);
    return {
      recived: 0,
      transmitted: 0,
    };
  }
};

const getUptime = () => {
  const uptime = os.uptime();
  const days = Math.floor(uptime / (24 * 3600));
  const hours = Math.floor((uptime % (24 * 3600)) / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const seconds = Math.floor(uptime % 60);

  return {
    days,
    hours,
    minutes,
    seconds,
  }
};

const getAllSysInfo = async ()  : Promise<SystemMetrics> =>  {
  const cpuLoad = getCpuLoad();
  const freeMemPercentage = getFreeMem();
  const loadAvg = getLoadAvg();
  const diskUsage = await getDiskUsage();
  const networkTraffic = await getNetworkTraffic();
  const uptime = getUptime();
  return {
    cpuLoad: Math.round(cpuLoad * 10) / 10,
    freeMemPercentage: Math.round(freeMemPercentage * 10) / 10,
    loadAvg,
    diskUsage,
    networkTraffic,
    uptime,
  };
};

export async function getSystemMetrics() : Promise<SystemMetrics> {
  const metrics = await getAllSysInfo();
  return metrics;
}
