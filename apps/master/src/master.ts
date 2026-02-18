import express, { type Express } from "express";
import http from "http";
import { Server, Socket } from "socket.io";
import { setWorkerStatus } from "./services/redi.service";
import { connectToDatabase } from "./config/db";
import crypto from "crypto";
import { routes } from "./routes/workers.routes";
import { socketRoutes } from "./routes/socket.routes";
import cors from "cors";


interface HandshakeQuery {
  workerId: string;
  signature: string;
  timestamp: string;
}

const app: Express = express();
app.use(express.json());
app.use(
  cors({
    origin: "*",
  }),
);
const server = http.createServer(app);

export const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

connectToDatabase();

app.use("/api", routes);

const verify = (
  workerId: string,
  signature: string,
  timestamp: string,
): boolean => {
  const expectedSignature = crypto
    .createHmac("sha256", process.env.SECRET_TOKEN as string)
    .update(workerId + timestamp)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature as string),
    Buffer.from(expectedSignature as string),
  );
};

io.on("connection", async (socket) => {
  const { workerId, signature, timestamp } = socket.handshake
    .query as unknown as HandshakeQuery;

  if (workerId) {
    const isRealWorker = verify(workerId, signature, timestamp);

    if (!isRealWorker) {
      console.log("Connection Refused: invalid signature");
      socket.disconnect();
      return;
    }
    socket.join(`worker:${workerId}`);
    console.log(`Connection Established: ${workerId} has been connected`);
    await setWorkerStatus(workerId as string, "IDLE");
  } else {
    console.log(`Frontend Client Connected: ${socket.id}`);
  }

  socketRoutes(socket, workerId);
});

server.listen(process.env.PORT);
