# SwitchGuard - Production Network Management & SNMP Monitoring Platform

A production-ready, vendor-independent network switch monitoring and management platform built on the MERN stack with native TypeScript.

SwitchGuard is designed for enterprise campus and data center environments, supporting managed switches from **Huawei, Cisco, Aruba/HPE, Juniper, and MikroTik**. It combines **sub-second push-based SNMP trap processing** with **periodic state reconciliation polling**, an **interactive chassis front-panel visualizer**, and **real-time WebSocket broadcasting**.

Initial hardware validation is targeted at the **Huawei S5720 Series** (e.g. S5720-28P-LI, S5720-SI, S5720-EI).

---

## High-Level Architecture & Event Pipeline

```
  Managed Switch (Huawei S5720 / Cisco)
         │
         │  [1] SNMP linkDown / linkUp Trap (UDP Port 162)
         ▼
  ┌─────────────────────────────────────────────────────────────┐
  │ SNMP Trap Receiver Daemon (server/src/snmp/trap.receiver.ts)│
  └──────────────────────────────┬──────────────────────────────┘
                                 │
                                 ▼ [2] Varbind Normalization
  ┌─────────────────────────────────────────────────────────────┐
  │ Vendor Adapter Factory (HuaweiAdapter / Cisco / Standard)   │
  └──────────────────────────────┬──────────────────────────────┘
                                 │
                                 ▼ [3] State Transition Correlation
  ┌─────────────────────────────────────────────────────────────┐
  │ Event Correlation Engine (server/src/services/event.service)│
  └───────────────┬─────────────────────────────┬───────────────┘
                  │                             │
    [4] Atomic DB Update          [5] Alarm Lifecycle Evaluation
                  │                             │
                  ▼                             ▼
  ┌─────────────────────────────┐ ┌─────────────────────────────┐
  │ MongoDB (Interface, Events) │ │ Alert Engine (Flap Dampener)│
  └─────────────────────────────┘ └──────────────┬──────────────┘
                                                 │
                                  [6] Real-Time Broadcast & Mail
                                                 │
                                 ┌───────────────┴───────────────┐
                                 ▼                               ▼
                 ┌─────────────────────────────┐ ┌─────────────────────────────┐
                 │ WebSocket Gateway (SocketIO)│ │ SMTP Email Notifier         │
                 └──────────────┬──────────────┘ └─────────────────────────────┘
                                │
                                ▼ [7] Instant Push (0-Refresh)
                 ┌─────────────────────────────┐
                 │ React Dashboard & Faceplate │
                 └─────────────────────────────┘
```

---

## Features

* **Vendor-Independent Architecture:** Built on standard RFC 1213 (MIB-II) and RFC 2863 (IF-MIB/ifXTable). Vendor specifics (Huawei VRP, Cisco IOS) are isolated in dedicated adapter plugins.
* **Dual Ingestion Engine:**
  * **Event-Driven Traps:** Immediate port `linkDown`/`linkUp` detection via UDP port 162.
  * **Periodic Polling:** Configurable interval poller (default 5 min) that audits DB state against real switch state, catching any UDP packets lost during network congestion.
* **Interactive Chassis Faceplate:** Visual representation of physical RJ45 and SFP+ ports with live green/red LED status lights, speed tooltips, and odd/even port numbering matching physical switches.
* **Port History Timeline:** Chronological audit trail showing every link transition, whether initiated via `TRAP` or `POLL`.
* **Alert Lifecycle & Flap Dampening:**
  * Automatically creates `CRITICAL` alerts on `linkDown`.
  * Automatically marks alerts as `RESOLVED` when the matching port comes back `UP`.
  * Flap dampening suppresses alarm storms if a port bounces $\ge 4$ times in 60 seconds.
* **Credential Security at Rest:** SNMP v2c community strings and SNMP v3 `authKey`/`privKey` are encrypted at rest using **AES-256-GCM**.
* **Audit Compliance Export:** 1-click CSV export for port event history and alert records.

---

## Technology Stack

* **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, TanStack React Query, React Hook Form, Zod, Lucide Icons, Socket.IO Client.
* **Backend:** Node.js, Express, TypeScript, Mongoose, MongoDB, net-snmp, Nodemailer, Socket.IO, crypto (AES-256-GCM).

---

## Project Structure

```
switchManagement/
├── client/                     # React Vite Single Page Application
│   ├── src/
│   │   ├── types/              # Shared frontend domain interfaces
│   │   ├── services/           # Axios API client & WebSocket client
│   │   ├── context/            # AuthContext (JWT, session persistence)
│   │   ├── components/         # Reusable UI controls (Badge, Button, Card, Modal, Navbar, Sidebar)
│   │   └── features/
│   │       ├── auth/           # Login screen with 1-click admin seeder
│   │       ├── dashboard/      # NOC dashboard, metric counters, event stream
│   │       ├── switches/       # Switch catalog, add modal with live reachability test, detail view
│   │       ├── interfaces/     # Chassis faceplate visualizer & port history modal
│   │       ├── alerts/         # Active & resolved alarms with operator acknowledge & CSV export
│   │       ├── events/         # Chronological link audit log with CSV export
│   │       └── system/         # UDP 162 daemon health diagnostics & email tester
└── server/                     # Express REST API & SNMP Daemon
    ├── scripts/
    │   ├── seed-huawei-switch.cjs # Seeds sample Huawei S5720 switch with 28 ports for testing
    │   └── simulate-trap.cjs      # Sends synthetic linkDown / linkUp traps
    ├── src/
    │   ├── config/             # Typed env loader & database connection
    │   ├── security/           # AES-256-GCM crypto, JWT, bcrypt
    │   ├── models/             # Mongoose schemas (Switch, Interface, Alert, PortEvent, User)
    │   ├── snmp/
    │   │   ├── mibs/           # Standard IF-MIB OIDs & Huawei Enterprise OIDs (PEN 2011)
    │   │   ├── adapters/       # Vendor adapters (HuaweiAdapter, CiscoAdapter, OptilinkAdapter, Base)
    │   │   ├── snmp.client.ts  # net-snmp v2c/v3 session manager & table walker
    │   │   ├── trap.parser.ts  # Decodes raw trap packets into domain events
    │   │   └── trap.receiver.ts # Asynchronous UDP 162 listener daemon
    │   ├── services/           # Switch, Interface, Event, Alert, Notification, and Polling services
    │   ├── websocket/          # Socket.IO broadcaster
    │   ├── api/                # Controllers, Zod validators, routes, and error middleware
    │   └── server.ts           # Server bootstrap
```

---

## Switch Configuration Guides

### 1. Huawei S5720 Series (VRP)

#### Option A: SNMP v2c Setup
Connect via console/SSH and enter system view:
```text
<Huawei> system-view
[Huawei] snmp-agent
[Huawei] snmp-agent sys-info version v2c
[Huawei] snmp-agent community read public
[Huawei] snmp-agent trap enable
[Huawei] snmp-agent target-host trap address udp-domain <SERVER_IP> params securityname public v2c
[Huawei] snmp-agent trap source GigabitEthernet0/0/1  # or your management VLAN interface
[Huawei] commit
[Huawei] save
```

#### Option B: SNMP v3 (USM with SHA + AES - Recommended for Production)
```text
<Huawei> system-view
[Huawei] snmp-agent
[Huawei] snmp-agent sys-info version v3
[Huawei] snmp-agent group v3 AdminGroup privacy
[Huawei] snmp-agent usm-user v3 snmpadmin AdminGroup authentication-mode sha AuthPassword123 privacy-mode aes128 PrivPassword123
[Huawei] snmp-agent trap enable
[Huawei] snmp-agent target-host trap address udp-domain <SERVER_IP> params securityname snmpadmin v3 privacy
[Huawei] commit
[Huawei] save
```

---

### 2. Cisco Catalyst / Nexus (IOS / IOS-XE)

#### SNMP v2c Setup
```text
Switch# configure terminal
Switch(config)# snmp-server community public RO
Switch(config)# snmp-server enable traps snmp linkdown linkup
Switch(config)# snmp-server host <SERVER_IP> version 2c public
Switch(config)# end
Switch# write memory
```

---

## Adding a New Switch Vendor (Adapter Pattern)

Adding support for a new vendor (e.g. MikroTik, Juniper, Aruba) requires **zero changes** to the database or alerting core:

1. Create `server/src/snmp/adapters/<vendor>.adapter.ts`:
   ```typescript
   import { BaseVendorAdapter } from './base.adapter.js';

   export class JuniperAdapter extends BaseVendorAdapter {
     override readonly vendor = 'JUNIPER';

     override matches(sysObjectID: string, sysDescr: string): boolean {
       return sysObjectID.includes('.1.3.6.1.4.1.2636') || sysDescr.includes('JUNOS');
     }

     override extractHardwareInfo(sysDescr: string, sysObjectID: string) {
       return {
         vendor: 'JUNIPER',
         model: 'EX-Series Switch',
         firmwareVersion: 'Junos OS'
       };
     }
   }
   ```
2. Register the adapter in `server/src/snmp/adapters/adapter.factory.ts`.
3. The system will automatically detect and normalize that vendor's hardware and ports!

---

## Quickstart (Development Mode)

### Prerequisites
* Node.js v20+ or v22+
* MongoDB running locally on `localhost:27017`

### 1. Start Backend Server
```powershell
cd server
npm install
npm run dev
```
* REST API: `http://localhost:5000/api/v1`
* Trap Receiver: `UDP 0.0.0.0:162`

### 2. Start Frontend Client
```powershell
cd client
npm install
npm run dev
```
* Web Dashboard: `http://localhost:5173`

### 3. Log In to Dashboard
* **URL:** `http://localhost:5173/login`
* **Default Email:** `admin@network.local`
* **Default Password:** `Admin@123456`
*(Or click "Click to Fill" on the login screen).*

---

## Testing with the Built-In Trap Simulator

You can test real-time alerting, port state changes, and automatic resolution without physical hardware:

```powershell
cd server

# Simulate Port 1 going DOWN (linkDown trap to UDP 162)
npm run simulate-trap linkDown 1 162
# ➔ Port turns red on the dashboard faceplate, CRITICAL alert triggered!

# Simulate Port 1 coming back UP (linkUp trap to UDP 162)
npm run simulate-trap linkUp 1 162
# ➔ Port turns green on the dashboard faceplate, Alert automatically marked RESOLVED!
```

---

## License
MIT License.
