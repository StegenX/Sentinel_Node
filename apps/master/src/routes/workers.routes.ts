import { Router } from "express";
import {
  AllWorkers,
  executeWorker,
  executeAll,
  getLogs,
  getWorkerLogs,
} from "../controllers/workers.controllers";
export const routes = Router();

routes.get("/workers", AllWorkers);

routes.post("/execute", executeWorker);
// routes.post("/execute/all", executeAll);
// routes.post("/spawn", spawnWorkers);

// routes.get("/logs", getLogs);
routes.get("/logs/:id", getWorkerLogs);
