const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('api', {
    // We'll leave this empty for now so the UI loads without errors
    status: () => "UI Only Mode"
});