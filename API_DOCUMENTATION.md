# YT Downloader — API & IPC Specification

## 1. Architecture Overview

YT Downloader uses a dual-layer communication model:
- **Electron IPC**: Handles native operating system dialogs, directory browsing, shell execution (opening files/folders), and credentials exchange.
- **Local Loopback REST & Socket.IO (`127.0.0.1:<dynamic_port>`)**: Powers media metadata inspection, high-throughput stream processing, and real-time progress events.

---

## 2. Security & Authentication

All API endpoints (except `/api/health`) require authentication via a session token generated dynamically by the Electron main process on boot:

```http
Header: x-session-token: <hex_encoded_token>
Query Parameter (fallback): ?token=<hex_encoded_token>
```

Requests lacking a valid token receive:
```json
{
  "success": false,
  "error": "Unauthorized: Invalid or missing session token."
}
```

---

## 3. Endpoints

### 3.1 Health Check
- **Route**: `GET /api/health`
- **Auth**: None
- **Response**:
```json
{
  "status": "ok",
  "service": "YT-Downloader-Backend",
  "pid": 14208,
  "uptime": 12.4,
  "timestamp": "2026-11-02T04:20:00.000Z"
}
```

---

### 3.2 Inspect Media Metadata
- **Route**: `POST /api/metadata`
- **Auth**: Required
- **Body**:
```json
{
  "url": "https://www.youtube.com/watch?v=aqz-KE-bpKQ"
}
```
- **Response**:
```json
{
  "success": true,
  "data": {
    "id": "aqz-KE-bpKQ",
    "title": "Big Buck Bunny 60fps 4K",
    "thumbnail": "https://i.ytimg.com/vi/aqz-KE-bpKQ/maxresdefault.jpg",
    "duration": 635,
    "durationFormatted": "10:35",
    "uploader": "Blender Foundation",
    "webpage_url": "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
    "formats": [
      {
        "format_id": "401",
        "ext": "mp4",
        "qualityLabel": "2160p",
        "resolution": "3840x2160",
        "fps": 60,
        "vcodec": "av01.0.12M.08",
        "acodec": "none",
        "filesize": 240334643,
        "sizeFormatted": "229.2 MB",
        "isEstimate": false,
        "type": "video_only"
      }
    ],
    "videoFormats": [...],
    "audioFormats": [...],
    "muxedFormats": [...]
  }
}
```

---

### 3.3 Create Download Task
- **Route**: `POST /api/downloads`
- **Auth**: Required
- **Body**:
```json
{
  "url": "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
  "mode": "merged", // "merged" | "video" | "audio"
  "videoFormatId": "401",
  "audioFormatId": "251",
  "customFilename": "Big Buck Bunny 4K",
  "outputDirectory": "C:\\Users\\User\\Downloads",
  "convertToMp3": false
}
```
- **Response** (`201 Created`):
```json
{
  "success": true,
  "message": "Download task created and enqueued.",
  "data": {
    "id": "task_1793593200000_abc123",
    "status": "queued",
    "progress": 0,
    "phase": "Queued"
  }
}
```

---

### 3.4 Cancel Download Task
- **Route**: `POST /api/downloads/:id/cancel`
- **Auth**: Required
- **Response**:
```json
{
  "success": true,
  "message": "Task task_1793593200000_abc123 has been canceled."
}
```

---

### 3.5 List Active Downloads
- **Route**: `GET /api/downloads`
- **Auth**: Required
- **Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "task_1793593200000_abc123",
      "status": "downloading",
      "progress": 45,
      "speedFormatted": "12.4 MB/s",
      "etaFormatted": "18s"
    }
  ]
}
```

---

### 3.6 Download History
- `GET /api/downloads/history`: Returns history array
- `DELETE /api/downloads/history/:id`: Removes single history record
- `DELETE /api/downloads/history`: Clears entire history

---

### 3.7 Settings Management
- `GET /api/settings`: Returns current configuration (default folder, concurrency limit, theme)
- `POST /api/settings`: Updates settings
- `GET /api/settings/temp-stats`: Returns storage statistics (file count, total bytes used)
- `POST /api/settings/clean-temp`: Purges stale scratch files

---

## 4. Socket.IO Real-Time Events

- **Client Connection**:
```javascript
const socket = io('http://127.0.0.1:<PORT>', {
  auth: { token: '<SESSION_TOKEN>' }
});
```

- **Inbound Event: `download:snapshot`**:
  Emits full snapshot of all active/queued tasks on connect.

- **Inbound Event: `download:progress`**:
  Emits whenever a task status or progress changes:
```json
{
  "id": "task_1793593200000_abc123",
  "status": "downloading", // "queued" | "downloading" | "merging" | "verifying" | "completed" | "failed" | "canceled"
  "phase": "Downloading video (1080p)...",
  "progress": 62,
  "downloadedBytes": 52428800,
  "totalBytes": 104857600,
  "speed": 8388608,
  "speedFormatted": "8.00 MB/s",
  "eta": 6,
  "etaFormatted": "6s",
  "outputPath": null,
  "error": null
}
```

---

## 5. Electron IPC Preload Interface (`window.electronAPI`)

- `getBackendInfo()`: Promise resolves `{ port: number, sessionToken: string }`
- `selectFolder()`: Opens native Windows directory picker; resolves string path or null
- `openFile(filePath)`: Invokes `shell.openPath`
- `openFolder(filePath)`: Invokes `shell.showItemInFolder`
- `getAppVersion()`: Returns desktop package version string

