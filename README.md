
# Exam Proctoring System-distributed-system

# Final UI Exam Proctoring System

A comprehensive full-stack web application demonstrating distributed systems concepts with exam proctoring features.

## 🚀 Features

### Core Functionality
- **Three Role-based Dashboards**: Teacher, Student, Admin
- **Exam Creation & Management**: MCQ-based exams with timers
- **Real-time Monitoring**: Live cheating detection and system logs
- **Mark Management**: Grading with conditional release

### Distributed Systems Implementation
- **Clock Synchronization**: Berkeley Algorithm for client-server time sync
- **Mutual Exclusion**: Ricart–Agrawala algorithm for resource access
- **Load Balancing**: Threshold-based server migration (80% capacity)
- **Replication**: Consistent data replication with 3-factor redundancy
- **Read/Write Locks**: Multi-reader, single-writer lock management
- **Cheating Detection**: Random simulation with warning/termination logic

### Technical Stack
- **Frontend**: React, Vite, TailwindCSS, Socket.IO Client, Axios
- **Backend**: Node.js, Express, Socket.IO, Mongoose
- **Database**: MongoDB (with fallback for demo)
- **Real-time**: WebSocket for live updates and clock sync

## 🛠️ Quick Start

### Prerequisites
- Node.js (v16+)
- npm or yarn
- MongoDB (optional - system works without it)

### Installation & Setup (Windows-friendly)

1. **Open a terminal in the project folder** (the folder that contains `client/` and `server/`). If needed:
   ```bash
   cd Exam-proctor-main\Exam-proctor-main
   ```

2. **Install server dependencies**:
   ```bash
   cd server
   npm install
   ```

3. **Install client dependencies**:
   ```bash
   cd ../client
   npm install
   ```

4. **Environment setup (optional)**:
   ```bash
   cd ../server
   cp .env.example .env
   # Edit .env if you have MongoDB running
   ```

> Tip (Windows PowerShell): If `cp` is unavailable, use `Copy-Item .env.example .env`.

### Running the Application

**Option 1: Run both server and client separately**

Terminal 1 (Server):
```bash
cd server
npm run dev
```

Terminal 2 (Client):
```bash
cd client
npm run dev
```

**Option 2: Using concurrently (install globally first)**
```bash
npm install -g concurrently
# Then from project root:
concurrently "cd server && npm run dev" "cd client && npm run dev"
```

### Access the Application
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5000
- **Health Check**: http://localhost:5000/api/health

### Demo Accounts (pre-seeded)
- **Teacher**: `amitkumarnerurkar@examproctor.com` / `teacher123`
- **Admin**: `admn@examproctor.com` / `admin123`
- **Student**: choose role `student`, provide any name and roll number (e.g., `CS001`).

## 👥 User Roles & Demo Flow

### 1. Teacher Login
- Role: `teacher`
- Name: `Dr. Smith` (or any name)
- Features:
  - Create MCQ exams with custom questions
  - Set exam duration and start exams
  - Monitor live cheating events
  - Release student marks

### 2. Student Login  
- Role: `student`
- Name: `John Doe` (or any name)
- Roll No: `CS001` (required)
- Features:
  - Automatic clock synchronization
  - Timed exam interface with navigation
  - Random cheating detection simulation
  - Warning popups and termination handling

### 3. Admin Login
- Role: `admin`
- Name: `System Admin` (or any name)
- Features:
  - Real-time system monitoring
  - Live log streaming with filters
  - Distributed system status panels
  - Event simulation controls

## 🧪 Testing the Distributed Systems

### Clock Synchronization (Berkeley Algorithm)
1. Login as a student
2. Check browser console for sync messages
3. Admin panel shows sync events in logs

### Cheating Detection
1. Student logged in automatically gets random warnings
2. 1st warning: marks halved
3. 2nd warning: exam terminated
4. Teacher sees live events
5. Admin can simulate additional events

### Load Balancing
1. Admin panel shows server status
2. Use "Add Load" button to simulate connections
3. Backup server activates at 80% main server load

### Replication & Locks
1. Admin panel shows replication metrics
2. Lock status visible when resources are accessed
3. Mutual exclusion queue shows waiting requests

## 🏗️ System Architecture

```
┌─────────────────┐    WebSocket    ┌─────────────────┐
│   React Client  │ ◄──────────────► │   Express API   │
│                 │                  │                 │
│ • Login/Auth    │    HTTP/REST     │ • Routes        │
│ • Dashboards    │ ◄──────────────► │ • Socket.IO     │
│ • Real-time UI  │                  │ • Distributed   │
└─────────────────┘                  │   Systems       │
                                     └─────────────────┘
                                              │
                                              ▼
                                     ┌─────────────────┐
                                     │    MongoDB      │
                                     │   (Optional)    │
                                     │                 │
                                     │ • Users         │
                                     │ • Exams         │
                                     │ • Submissions   │
                                     │ • System Logs   │
                                     └─────────────────┘
```

## 📁 Project Structure

```
Exam-proctor-main/
  client/                 # React app (Vite, Tailwind, Socket.IO client)
    src/
      components/         # Role dashboards and feature pages
      utils/              # api.js (Axios), socket.js (Socket.IO init)
    package.json          # scripts: dev/build/preview
  server/                 # Express API + Socket.IO
    routes/               # auth, exam, submission, admin, students
    models/               # User, Exam, Submission, SystemLog (Mongoose)
    distributed/          # clockSync, cheatingDetection, locks, replication, etc.
    index.js              # server entrypoint
    package.json          # scripts: start/dev
  README.md
  *.csv                   # sample questions and student list
```

## 📊 Distributed Systems Components

### Clock Synchronization (Berkeley)
- **Why**: Keep student exam timers aligned with server time.
- **How**: Server polls clients, computes average offset, sends corrections.
- **Cadence**: ~5s intervals while a student is in exam context.
- **Events**: `clock-sync` messages via Socket.IO to student sockets.
- **Observe**: Browser console (student) and `Admin → Logs`.

### Mutual Exclusion (Ricart–Agrawala)
- **Why**: Ensure exclusive access to shared resources (e.g., grade release).
- **How**: Timestamped request/reply; deferred queue for pending writers.
- **State**: Shows requester queue and holder when active.
- **Events**: `mutex-request`, `mutex-grant`, `mutex-release`.
- **Observe**: `Admin → Logs` and affected UI actions.

### Load Balancer (Threshold-based)
- **Why**: Simulate failover when main server approaches capacity.
- **How**: Backup activates at ~80% load, new sessions redirected.
- **Controls**: Admin can simulate load spikes.
- **Events**: `load-update`, `server-failover`.
- **Observe**: `Admin → Logs` and server status panel.

### Replication (Majority Consensus)
- **Why**: Tolerate node failures while keeping exam data available.
- **How**: 3 replicas per chunk; writes require majority ACKs.
- **Failure Model**: Random node failure/recovery simulation.
- **Events**: `replica-write`, `replica-commit`, `node-status`.
- **Observe**: `Admin → Logs` replication entries.

### Read/Write Locks (Multi-reader, Single-writer)
- **Why**: Allow concurrent reads but serialize writes to shared datasets.
- **How**: Readers share lock; writers wait until readers drain.
- **State**: Current readers count, waiting writers queue.
- **Events**: `lock-acquired`, `lock-released`, `lock-waiting`.
- **Observe**: `Admin → Logs` and lock badges in UI where applicable.

## 🐛 Troubleshooting

### Common Issues

**MongoDB Connection Errors**
- System works without MongoDB (uses in-memory fallback)
- Check connection string in `.env` if using MongoDB

**Port Conflicts**
- Server: Change PORT in `.env` (default: 5000)
- Client: Change port in `vite.config.js` (default: 3000)

**Socket Connection Issues**
- Ensure both server and client are running
- Check browser console for connection errors
- Verify CORS settings in server

**Windows-specific tips**
- If PowerShell blocks scripts, run terminal as Administrator and execute: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`
- If `cp` fails in PowerShell, use `Copy-Item` instead.
- If ports are busy: in PowerShell, `netstat -ano | findstr ":3000"` (or `:5000`) then `taskkill /PID <pid> /F`.

**Build Issues**
- Clear node_modules: `rm -rf node_modules && npm install` (macOS/Linux) or `rmdir /S /Q node_modules` then `npm install` (Windows)
- Check Node.js version (requires v16+)

### Performance Notes
- System generates logs every few seconds
- MongoDB is optional - fallback ensures demo works
- Distributed systems run simulation timers
- Browser may show WebSocket reconnection attempts

## 🎯 Demo Highlights

1. **Multi-role Authentication** without complex auth systems
2. **Real-time Updates** via WebSocket for all dashboards  
3. **Distributed Algorithms** with visual feedback
4. **Fault Tolerance** with MongoDB fallback
5. **Modern UI** with TailwindCSS and responsive design
6. **System Monitoring** with live metrics and logs

## 📝 Additional Notes

- All distributed systems features are simulated for demonstration
- Clock sync works with actual browser time
- Cheating detection uses random intervals (15-45 seconds)
- Load balancing thresholds are configurable
- System logs are kept in memory (last 1000 entries)
- No actual authentication - simplified for demo purposes

## 🔧 Customization

The system is designed to be easily extendable:
- Add more exam question types
- Implement additional distributed algorithms
- Enhance cheating detection with real browser APIs
- Add persistent storage layers
- Integrate with actual authentication systems
>>>>>>> e1a3a2a (inital commit)
