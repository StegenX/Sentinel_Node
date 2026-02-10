# Sentinel Node

### Distributed Real-Time System Monitoring & Task Execution Engine

Sentinel Node is a high-performance, event-driven orchestration platform built with Node.js. It allows a centralized Master Server to manage, monitor, and execute system-level commands across a fleet of remote Worker Nodes in real-time.

---

## 🚀 **The Mission**

The goal of this project was to move beyond standard CRUD applications and tackle the complexities of distributed systems, concurrency, and real-time data streaming. It demonstrates how to manage persistent bi-directional communication and handle system-level processes safely at scale.

---

## 🛠 **Key Technical Features**

- **Real-Time Bi-Directional Communication:** Leverages WebSockets (Socket.io) for low-latency command dispatching and status reporting.

- **Distributed Architecture:** A decoupled system where the Master manages state and the Workers handle execution, allowing for horizontal scaling.

- **Live Stream Tailing:** Implements Node.js Streams to pipe stdout/stderr from a worker process directly to the master dashboard without memory-intensive buffering.

- **Ephemeral State Management:** Uses Redis for high-speed "Heartbeat" tracking and worker health monitoring with automatic TTL-based expiry.

- **Persistent Task Auditing:** A MongoDB backend records full execution histories, exit codes, and timestamps for every task dispatched.

- **System-Level Integration:** Utilizes the child_process module to bridge high-level Node.js logic with underlying Linux system commands.

---

## 🏗 **System Architecture**

The system is divided into three primary layers:

- **The Control Plane (Master):** An Express & Socket.io server that acts as the brain. It tracks which workers are online and provides an API to trigger tasks.

- **The Data Plane (Worker):** A lightweight agent that monitors OS metrics (CPU/RAM) and executes authorized shell commands.

- **The Transport Layer:** A custom JSON-based protocol over WebSockets that handles task requests, stream chunks, and heartbeats.

---

## 🧰 **Tech Stack**

- **Runtime:** Node.js (TypeScript)

- **State/Cache:** Redis

- **Database:** MongoDB (Mongoose)

- **Networking:** Socket.io

- **DevOps:** Docker & Docker Compose

---

## 🧠 **What I Learned**

- Managing race conditions in distributed state.

- Handling Backpressure when streaming high-volume logs over a network.

- Designing a robust Heartbeat mechanism to handle "unclean" worker disconnections.

- Securing shell execution within a Node.js environment.