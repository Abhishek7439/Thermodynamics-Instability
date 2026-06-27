/**
 * Electron Main Process
 * Thermodynamic Instability Dashboard — Desktop Edition
 *
 * - Creates the main browser window
 * - Spawns the Flask backend as a child process
 * - Handles graceful shutdown
 */
const { app, BrowserWindow, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const net = require('net');

let mainWindow = null;
let backendProcess = null;
let backendPort = 5000;

// ── Find an available port ─────────────────────────────────────────────────────
function findAvailablePort(startPort) {
    return new Promise((resolve) => {
        const server = net.createServer();
        server.listen(startPort, () => {
            const port = server.address().port;
            server.close(() => resolve(port));
        });
        server.on('error', () => {
            resolve(findAvailablePort(startPort + 1));
        });
    });
}

// ── Start Flask Backend ────────────────────────────────────────────────────────
async function startBackend() {
    backendPort = await findAvailablePort(5000);

    const isPacked = app.isPackaged;
    const backendDir = isPacked
        ? path.join(process.resourcesPath, 'backend')
        : path.join(__dirname, '..', 'backend');

    const serverScript = path.join(backendDir, 'server.py');

    // Try system Python
    const pythonCandidates = process.platform === 'win32'
        ? ['python', 'python3', 'py']
        : ['python3', 'python'];

    for (const pythonCmd of pythonCandidates) {
        try {
            backendProcess = spawn(pythonCmd, [serverScript], {
                cwd: backendDir,
                env: {
                    ...process.env,
                    FLASK_PORT: String(backendPort),
                    PYTHONDONTWRITEBYTECODE: '1'
                },
                stdio: ['ignore', 'pipe', 'pipe'],
                windowsHide: true
            });

            backendProcess.stdout.on('data', (data) => {
                console.log(`[Backend] ${data.toString().trim()}`);
            });

            backendProcess.stderr.on('data', (data) => {
                console.error(`[Backend] ${data.toString().trim()}`);
            });

            backendProcess.on('error', (err) => {
                console.warn(`[Backend] Failed with ${pythonCmd}:`, err.message);
                backendProcess = null;
            });

            backendProcess.on('exit', (code) => {
                console.log(`[Backend] Exited with code ${code}`);
                backendProcess = null;
            });

            // Wait a moment to see if it starts successfully
            await new Promise(resolve => setTimeout(resolve, 1500));

            if (backendProcess && !backendProcess.killed) {
                console.log(`[Backend] Started on port ${backendPort} using ${pythonCmd}`);
                return true;
            }
        } catch (err) {
            console.warn(`[Backend] ${pythonCmd} not available`);
        }
    }

    console.warn('[Backend] No Python found — running in frontend-only mode');
    return false;
}

// ── Stop Flask Backend ─────────────────────────────────────────────────────────
function stopBackend() {
    if (backendProcess) {
        console.log('[Backend] Shutting down...');
        if (process.platform === 'win32') {
            spawn('taskkill', ['/pid', String(backendProcess.pid), '/f', '/t'], {
                windowsHide: true
            });
        } else {
            backendProcess.kill('SIGTERM');
        }
        backendProcess = null;
    }
}

// ── Create Main Window ─────────────────────────────────────────────────────────
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 900,
        minHeight: 600,
        title: 'Thermodynamic Instability Dashboard',
        icon: path.join(__dirname, 'build', 'icon.ico'),
        backgroundColor: '#0b1120',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true
        },
        autoHideMenuBar: true,
        show: false  // Show after ready-to-show
    });

    // Show window once content is loaded (avoids white flash)
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    // Load the frontend
    const isPacked = app.isPackaged;
    const appDir = isPacked
        ? path.join(__dirname, 'app')
        : path.join(__dirname, '..');

    mainWindow.loadFile(path.join(appDir, 'index.html'));

    // Inject the backend URL into the page
    mainWindow.webContents.on('did-finish-load', () => {
        mainWindow.webContents.executeJavaScript(
            `window.__ELECTRON_API_BASE__ = 'http://localhost:${backendPort}';`
        );
    });

    // Open external links in default browser
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith('http')) {
            shell.openExternal(url);
        }
        return { action: 'deny' };
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// ── App Lifecycle ──────────────────────────────────────────────────────────────
app.whenReady().then(async () => {
    await startBackend();
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    stopBackend();
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('before-quit', () => {
    stopBackend();
});

app.on('will-quit', () => {
    stopBackend();
});
