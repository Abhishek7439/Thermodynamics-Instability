/**
 * Electron Preload Script
 * Securely exposes limited APIs from the main process to the renderer.
 */
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // Platform information
    getPlatformInfo: () => ({
        platform: process.platform,
        arch: process.arch,
        isElectron: true
    }),

    // Get the dynamically assigned backend URL
    getBackendUrl: () => {
        return window.__ELECTRON_API_BASE__ || 'http://localhost:5000';
    }
});
