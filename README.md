# YT Downloader — Self-Contained Desktop Application

A modern, high-performance Windows desktop application built with **Electron**, **React**, **Vite**, **Express**, and bundled with **yt-dlp**, **FFmpeg**, and **FFprobe**.

YT Downloader allows users to inspect available formats and quality options for authorized media URLs, and download content in three distinct modes:
1. **Video + Audio (Merged)**: Video and audio streams merged into a single MP4 or WebM file with automatic FFmpeg stream copy / adaptation.
2. **Video Only**: Pure video stream without audio tracks.
3. **Audio Only**: Direct original audio export (M4A / WebM) or universal MP3 conversion.

The application is **100% self-contained**: end users do not need to install Node.js, Python, FFmpeg, yt-dlp, or any external dependency.

---

## Architecture Diagram

```
+-------------------------------------------------------------------------+
|                              ELECTRON DESKTOP                            |
|                                                                         |
|  +--------------------------------+   +-------------------------------+ |
|  |     REACT + VITE FRONTEND      |   |        ELECTRON MAIN          | |
|  |  (Context Isolation: true)     |   |   - Lifecycle Manager         | |
|  |  - Navbar, URL Input           |   |   - Native Windows Dialogs    | |
|  |  - Format Selection Table      |   |   - App Shell & Security      | |
|  |  - Live Progress & History     |   |   - Session Token Generator   | |
|  +----------------+---------------+   +---------------+---------------+ |
|                   |                                   |                 |
|                   | IPC (Strict Preload Bridge)       |                 |
|                   +----------------->                 |                 |
|                                                       | Spawns &        |
|                   +-----------------------------------+ Supervises      |
|                   |                                                     |
|                   v                                                     |
|  +--------------------------------------------------------------------+ |
|  |                      LOCAL NODE.JS EXPRESS BACKEND                 | |
|  |                   (Bound to 127.0.0.1 on dynamic port)             | |
|  |   - REST API (Metadata, Downloads, Settings)                       | |
|  |   - Socket.IO Real-time Progress Server                            | |
|  |   - Session Token Authentication                                   | |
|  |   - Process Manager (Zero Orphan Subprocess Guarantee)             | |
|  +--------------------+---------------------------+-------------------+ |
+-----------------------|---------------------------|---------------------+
                        | Spawns with array args    | Spawns with array args
                        v                           v
     +--------------------------------+  +--------------------------------+
     |       BUNDLED yt-dlp.exe       |  |   BUNDLED ffmpeg & ffprobe     |
     |   - JSON metadata extraction   |  |   - Stream merging (-c copy)   |
     |   - Stream downloading         |  |   - Audio transcode (MP3)      |
     |   - Real-time progress events  |  |   - Stream verification        |
     +--------------------------------+  +--------------------------------+
```

---

## Technology Stack

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| **Frontend** | React | `^18.3.1` | User interface and state management |
| **Build Tool** | Vite | `^6.1.0` | Ultra-fast asset bundler & HMR |
| **Styling** | Tailwind CSS | `^3.4.17` | Clean responsive dark theme UI |
| **Icons** | Lucide React | `^0.475.0` | Modern vector interface iconography |
| **Desktop Runtime** | Electron | `^34.2.0` | Secure Windows desktop application shell |
| **Backend** | Express | `^4.21.2` | Local REST service on loopback |
| **Realtime** | Socket.IO | `^4.8.1` | Live download progress streaming |
| **Media Extraction** | yt-dlp | `2026.10.26` | Media metadata & stream retrieval |
| **Media Processing** | FFmpeg & FFprobe | `9.0.2 Gyan` | Stream merging, transcoding, & verification |
| **Packaging** | Electron Builder | `^25.1.8` | Portable Windows EXE & NSIS Installer |
| **Testing** | Vitest & Supertest| `^3.0.5` | Automated unit, integration, & security tests |

---

## Project Structure

```
YT-Downloader-With-Merger/
├── electron/
│   ├── main.js                     # Main electron process & window lifecycle
│   ├── preload.js                  # Context-isolated secure IPC bridge
│   ├── ipc/
│   │   ├── appHandlers.js          # Native dialogs and shell handlers
│   │   └── downloadHandlers.js     # Download IPC routing
│   └── services/
│       └── backendLifecycle.js     # Dynamic port supervisor and health checker
│
├── backend/
│   ├── server.js                   # HTTP & Socket.IO server entry point
│   ├── app.js                      # Express middleware and routing configuration
│   ├── routes/
│   │   ├── metadataRoutes.js       # URL format inspection routes
│   │   ├── downloadRoutes.js       # Task management & download history routes
│   │   └── settingsRoutes.js       # Storage, cache, & preferences routes
│   ├── controllers/
│   │   ├── metadataController.js   # Metadata controller logic
│   │   └── downloadController.js   # Download queue and task controller logic
│   ├── services/
│   │   ├── ytDlpService.js         # Safe execution of yt-dlp binary
│   │   ├── ffmpegService.js        # Stream merging, conversion, & FFprobe checks
│   │   ├── formatService.js        # Format parsing, codec matching, size calculation
│   │   └── downloadService.js      # Concurrency queue & task lifecycle manager
│   ├── middleware/
│   │   ├── validation.js           # URL security & session token validation
│   │   └── errorHandler.js         # Error handling with internal path masking
│   └── utils/
│       ├── processManager.js       # Child process supervisor & tree cancellation
│       ├── fileManager.js          # Binary discovery, path validation, temp cleanup
│       └── sizeFormatter.js        # Byte conversions & defensible size estimates
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx          # Header, navigation tabs, status badge, theme
│   │   │   ├── UrlInput.jsx        # URL input, clipboard paste, inspection trigger
│   │   │   ├── VideoPreview.jsx    # Thumbnail, duration, title, channel info
│   │   │   ├── DownloadModeSelector.jsx # Merged / Video / Audio mode selector
│   │   │   ├── QualitySelector.jsx # Quick resolution / audio stream cards
│   │   │   ├── FormatTable.jsx     # Full format table with filters and sorting
│   │   │   ├── DownloadProgress.jsx# Real-time progress bar, speed, ETA, cancellation
│   │   │   └── DownloadHistory.jsx # Past downloads with Open File / Folder
│   │   ├── pages/
│   │   │   ├── Home.jsx            # Main downloader screen
│   │   │   ├── Downloads.jsx       # Active download manager screen
│   │   │   └── Settings.jsx        # Output folder, concurrency, cache manager
│   │   ├── services/
│   │   │   └── api.js              # Axios & Socket.IO API client
│   │   ├── App.jsx                 # Root React component
│   │   ├── main.jsx                # React DOM entry
│   │   └── index.css               # Tailwind CSS entry
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── resources/
│   ├── win/
│   │   ├── yt-dlp.exe              # Bundled yt-dlp binary
│   │   ├── ffmpeg.exe              # Bundled FFmpeg binary
│   │   └── ffprobe.exe             # Bundled FFprobe binary
│   └── icons/
│       ├── icon.ico                # Multi-resolution Windows app icon
│       ├── icon.png                # High-res PNG icon
│       └── icon.svg                # Vector master icon
│
├── tests/
│   ├── unit/                       # Unit tests (formatService, sizeFormatter, validation, etc.)
│   ├── integration/                # Integration tests (APIs, FFmpeg, E2E lifecycle)
│   ├── security/                   # Injection, traversal, and authorization tests
│   └── fixtures/                   # Realistic metadata JSON fixtures
│
├── scripts/
│   ├── download-binaries.js        # Automated binary downloader
│   ├── verify-binaries.js          # Executable integrity verification
│   ├── create-icon.ps1             # Native icon generator
│   ├── dev.js                      # Development orchestrator (Vite + Electron)
│   └── build.js                    # Production build and test orchestrator
│
├── release/                        # Packaged deliverables output
│   ├── YT Downloader Setup 1.0.0.exe # NSIS Windows Installer
│   ├── YT Downloader-Portable-1.0.0.exe # Portable Windows EXE
│   └── win-unpacked/               # Unpacked distribution directory
│
├── electron-builder.yml            # Electron Builder packaging configuration
├── package.json                    # Root package configuration
└── README.md
```

---

## Getting Started (Developers)

### Prerequisites
- Windows 10 or 11 (x64)
- Node.js `^20.0.0` or `^24.0.0`
- Git

### Installation
Clone the repository and install dependencies:
```powershell
git clone <repository_url>
cd YT-Downloader-With-Merger

# Install root dependencies (Electron, backend, test tools)
npm install

# Install frontend dependencies (React, Vite, Tailwind)
npm install --prefix frontend
```

### Download & Verify Binaries
Download official pre-built `yt-dlp.exe`, `ffmpeg.exe`, and `ffprobe.exe` into `resources/win/`:
```powershell
npm run download-binaries
npm run verify-binaries
```

---

## Running in Development

Launch both Vite and the Electron desktop application with hot reload:
```powershell
npm run dev
```

Or run the frontend and backend independently:
```powershell
# Start Express backend standalone
npm run start:backend

# Start Vite frontend dev server
npm run dev:frontend
```

---

## Running Automated Tests

Run the full automated test suite with Vitest:
```powershell
# Run all unit, integration, and security tests
npm test

# Run tests in watch mode
npm run test:watch
```

Test categories:
- **Unit Tests**: `tests/unit/` (Format parsing, file size formatting, URL validation, process tracking, filename sanitization).
- **Integration Tests**: `tests/integration/` (Metadata API, Download API, Settings API, FFmpeg stream merging & FFprobe verification).
- **Security Tests**: `tests/security/` (Command injection rejection, path traversal rejection, session token authorization).
- **End-to-End Tests**: `tests/integration/e2eDownloadLifecycle.test.js` (Live Creative Commons media download, progress events, output stream validation, cancellation).

---

## Packaging & Distribution

Build the production React frontend and package Windows installers:

```powershell
# Build both Portable EXE and Windows NSIS Installer
npm run dist:all

# Build Portable EXE only
npm run dist:portable

# Build NSIS Installer only
npm run dist:nsis

# Build unpacked folder for quick local verification
npm run pack
```

Packaged deliverables will be located in the `release/` folder:
- **Portable Executable**: `release/YT Downloader-Portable-1.0.0.exe`
- **Windows Installer**: `release/YT Downloader Setup 1.0.0.exe`

---

## Security Considerations

1. **Context Isolation**: Enabled in Electron's `BrowserWindow`. Renderer processes cannot access Node.js primitives or arbitrary filesystem APIs.
2. **Preload API**: Only explicit, sanitized functions are exposed through `window.electronAPI`.
3. **Session Token Protection**: The Express backend binds strictly to `127.0.0.1` on a dynamic port and requires an in-memory session token generated by the main process on boot.
4. **Command Injection Prevention**: Child processes (`yt-dlp.exe` and `ffmpeg.exe`) are spawned strictly using argument arrays (`child_process.spawn`). No shell strings (`child_process.exec`) are ever constructed with user input.
5. **Path Traversal Defense**: All filenames and directory selections are sanitized against Windows illegal characters and directory traversal (`..`).
6. **No DRM Circumvention**: The application is designed solely for authorized, user-owned, and legally permissible content. It contains no mechanisms to bypass DRM or access controls.

---

## Binary Licensing & Attribution

- **yt-dlp**: Licensed under The Unlicense ([yt-dlp repository](https://github.com/yt-dlp/yt-dlp)).
- **FFmpeg & FFprobe**: Licensed under the GNU General Public License (GPL) version 3 ([FFmpeg project](https://ffmpeg.org)). Windows build provided by Gyan.dev.
- **Electron**: Licensed under the MIT License ([Electron](https://github.com/electron/electron)).

---

## Troubleshooting

- **Backend Startup Timeout**: If third-party antivirus software delays execution of child processes, ensure `resources/win/` is permitted.
- **Node JS Signature Challenge Warning**: yt-dlp automatically utilizes the bundled Node.js runtime (`--js-runtimes node`) for JavaScript challenge solving.
- **Temporary Storage**: Scratch files are stored in the OS temp directory under `yt-downloader-temp` and cleaned up automatically. Safe manual cleanup is accessible via **Settings -> Clear Temp Cache**.
