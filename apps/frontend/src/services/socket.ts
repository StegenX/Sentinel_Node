import { io } from 'socket.io-client';

// Connect WITHOUT a workerId query param so the master treats this as a
// frontend client (see master.ts line 68: "Frontend Client Connected")
const MASTER_URL = import.meta.env.VITE_MASTER_URL || 'http://localhost:3000';

export const socket = io(MASTER_URL, {
    autoConnect: true,
    reconnection: true,
    reconnectionDelay: 2000,
});

export default socket;
