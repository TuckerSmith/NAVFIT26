// main.js
const { app, BrowserWindow, ipcMain, dialog } = require('electron'); 
const path = require('path');
const fs = require('fs');
const sqlite3 = require('better-sqlite3');

// Define the database path
const DB_PATH = path.join(app.getPath('userData'), 'navfit26.db');
let db = null;

// --- Database Initialization and Setup ---
function initializeDatabase() {
    // Open the database file. If it doesn't exist, it will be created.
    db = new sqlite3.Database(DB_PATH, (err) => {
        if (err) {
            console.error('Database connection error:', err.message);
            return;
        }
        console.log('Connected to the SQLite database.');
        
        // Create the initial table for FITREPs if it doesn't exist
        db.run(`CREATE TABLE IF NOT EXISTS fitreps (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            grade TEXT,
            data TEXT -- Store the entire FITREP data as a JSON string
        )`, (err) => {
            if (err) {
                console.error('Table creation error:', err.message);
            }
        });
    });
}


// --- IPC Listener Functions (The "Backend" API) ---
ipcMain.handle('db:saveFitrep', async (event, fitrepData) => {
    // Note: In a real app, you would encrypt PII before saving here!
    
    const { name, grade } = fitrepData;
    const dataString = JSON.stringify(fitrepData);

    return new Promise((resolve, reject) => {
        db.run(
            `INSERT INTO fitreps (name, grade, data) VALUES (?, ?, ?)`,
            [name, grade, dataString],
            function(err) {
                if (err) {
                    console.error('Database INSERT error:', err.message);
                    return reject(err.message);
                }
                // Return the ID of the new row
                resolve({ id: this.lastID, message: 'Fitrep saved successfully.' });
            }
        );
    });
});

ipcMain.handle('db:loadFitreps', async () => {
    return new Promise((resolve, reject) => {
        // Only select the ID and basic metadata for the list view
        db.all(`SELECT id, name, grade FROM fitreps ORDER BY id DESC`, [], (err, rows) => {
            if (err) {
                console.error('Database SELECT error:', err.message);
                return reject(err.message);
            }
            resolve(rows);
        });
    });
});

ipcMain.handle('db:export', async () => {
    // Ask the user where they want to save the file
    const { filePath } = await dialog.showSaveDialog({
        title: 'Export NAVFIT26 Database',
        defaultPath: path.join(app.getPath('desktop'), 'MyEvals.sqlite'),
        filters: [
            { name: 'SQLite Database', extensions: ['sqlite', 'db'] }
        ]
    });

    // If the user didn't cancel, copy the file
    if (filePath) {
        try {
            // DB_PATH is the variable pointing to your 'navfit26.db'
            fs.copyFileSync(DB_PATH, filePath);
            return { success: true, path: filePath };
        } catch (error) {
            console.error("Export failed:", error);
            return { success: false, message: error.message };
        }
    }
    return { success: false, message: 'Export cancelled' };
});

ipcMain.handle('export:pdf', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    
    const { filePath } = await dialog.showSaveDialog({
        title: 'Export FITREP as PDF',
        defaultPath: path.join(app.getPath('desktop'), 'FITREP.pdf'),
        filters: [{ name: 'PDF Files', extensions: ['pdf'] }]
    });

    if (filePath) {
        // Options for the PDF layout
        const options = {
            marginsType: 0,
            pageSize: 'A4',
            printBackground: true, // Crucial for keeping your CSS styling
            landscape: false
        };

        try {
            const data = await win.webContents.printToPDF(options);
            fs.writeFileSync(filePath, data);
            return { success: true, path: filePath };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }
    return { success: false };
});


// --- Electron App Lifecycle ---
const createWindow = () => {
    mainWindow = new BrowserWindow({
        width: 900,
        height: 1000,
        minWidth: 800,
        minHeight: 600,
        resizable: true,
        autoHideMenuBar: true,
	        webPreferences: {
            // This looks in the same folder (electron2.1) for preload.js
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
			webSecurity: false
        }
    });
	const frontendPath = path.join(__dirname, 'frontend_build/index.html') // Production: looks

// WIRING: This tells Electron to find the built React code in frontend2.1
    // The '../' goes up from electron2.1 into the root, then into frontend2.1
    mainWindow.loadFile(frontendPath);
	mainWindow.webContents.openDevTools();
};

app.whenReady().then(createWindow);

// Standard Electron lifecycle handling
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
