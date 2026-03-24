const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    // This connects your 'window.api.exportPDF' to the 'export:pdf' in main.js
    exportPDF: () => ipcRenderer.invoke('export:pdf'),
    exportDatabase: () => ipcRenderer.invoke('db:export'),
    saveFitrep: (data) => ipcRenderer.invoke('db:saveFitrep', data),
});