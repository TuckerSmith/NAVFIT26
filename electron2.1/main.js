const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { execFile } = require('child_process');

// Logic Modules - Pathing is relative to this file (electron2.1/)
const FitRepData = require('../backend2.1/FitRepData');
const FitRepMapper = require('../backend2.1/FitRepMapper');
const PdfFiller = require('../backend2.1/PdfFiller');

// --- 1. CONFIGURATION & PATHS ---
const IS_PROD = app.isPackaged;

// Use app.getAppPath() to anchor everything correctly inside the ASAR
const APP_ROOT = app.getAppPath(); 

// --- 2. ASSET PATHING (The critical fix) ---
// In Production, extra files like Java and Templates should stay OUTSIDE the ASAR 
// to avoid extraction errors, or be explicitly mapped.
const JAVA_BIN = IS_PROD
    ? path.join(process.resourcesPath, 'bin', 'jre', 'bin', 'java')
    : path.join(APP_ROOT, 'bin', 'jre', 'bin', 'java');

const JAR_PATH = IS_PROD
    ? path.join(process.resourcesPath, 'bin', 'app.jar')
    : path.join(APP_ROOT, 'bin', 'app.jar');

const PDF_TEMPLATE = IS_PROD
    ? path.join(process.resourcesPath, 'templates', 'navfit_fitrep_report_fillable_template.pdf')
    : path.join(APP_ROOT, '..', 'templates', 'navfit_fitrep_report_fillable_template.pdf');

// --- 3. USER DATA PATHS (Writing files) ---
const DOCUMENTS_DIR = app.getPath('documents');
const USER_OUTPUT_DIR = path.join(DOCUMENTS_DIR, 'NavFit_Output');
const INTERNAL_DATA_DIR = path.join(app.getPath('userData'), 'internal_data');

// Ensure directories exist immediately
if (!fs.existsSync(USER_OUTPUT_DIR)) fs.mkdirSync(USER_OUTPUT_DIR, { recursive: true });
if (!fs.existsSync(INTERNAL_DATA_DIR)) fs.mkdirSync(INTERNAL_DATA_DIR, { recursive: true });

const DEFAULTS = {
    ACCDB_IN: path.join(APP_ROOT, '..', 'db_files', 'Murphy_example_FITREP.accdb'),
    SQLITE: path.join(INTERNAL_DATA_DIR, 'migrated_reports.db'),
    ACCDB_OUT: path.join(USER_OUTPUT_DIR, 'Murphy_example_FITREP_NEW.accdb'),
    PDF_OUT_DIR: USER_OUTPUT_DIR
};

// ... keep your Java and Report logic functions as they are ...

// --- 5. APP LIFECYCLE (GUI Setup) ---
function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true, // Required for your current setup
            contextIsolation: false, 
            webSecurity: false,
            preload: path.join(__dirname, 'preload.js') 
        }
    });

    // Pathing for the UI
    const indexPath = IS_PROD
        ? path.join(APP_ROOT, 'frontend_build', 'index.html') // Matches your 'to': 'frontend_build' mapping
        : path.join(APP_ROOT, '..', 'frontend2.1', 'dist', 'index.html');

    console.log("Loading UI from:", indexPath);
    win.loadFile(indexPath).catch((err) => console.error("FAILED TO LOAD UI:", err));
}

// ... keep the rest of your lifecycle listeners ...

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
