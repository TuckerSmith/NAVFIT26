const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { execFile } = require('child_process');
const Database = require('better-sqlite3');

// --- 0. BACKEND MODULES (Colleague Update: Points to /src/) ---
const FitRepData = require('../backend2.1/src/FitRepData');
const FitRepMapper = require('../backend2.1/src/FitRepMapper');
const PdfFiller = require('../backend2.1/src/PdfFiller');

// --- 1. CONFIGURATION & PATHS ---
const IS_PROD = app.isPackaged;
const APP_ROOT = app.getAppPath(); 

// For assets outside the ASAR (bin, templates)
const EXTERNAL_ROOT = IS_PROD 
    ? process.resourcesPath 
    : APP_ROOT;

// Java Runtime & JAR
const JAVA_BIN = path.join(EXTERNAL_ROOT, 'bin', 'jre', 'bin', 'java');
const JAR_PATH = path.join(EXTERNAL_ROOT, 'bin', 'app.jar');

// PDF Template
const PDF_TEMPLATE = path.join(EXTERNAL_ROOT, 'templates', 'navfit_fitrep_report_fillable_template.pdf');

// --- 2. DYNAMIC USER PATHS ---
const DOCUMENTS_DIR = app.getPath('documents');
const USER_OUTPUT_DIR = path.join(DOCUMENTS_DIR, 'NavFit_Output');

// Internal Data (SQLite location)
const INTERNAL_DATA_DIR = IS_PROD
    ? path.join(app.getPath('userData'), 'internal_data')
    : path.join(__dirname, 'output_files');

const DEFAULTS = {
    SQLITE: path.join(INTERNAL_DATA_DIR, 'migrated_reports.db'),
    ACCDB_OUT: path.join(USER_OUTPUT_DIR, 'Murphy_example_FITREP_NEW.accdb')
};

// Ensure directories exist immediately
[USER_OUTPUT_DIR, INTERNAL_DATA_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// --- 3. CORE LOGIC FUNCTIONS ---
function runJava(args) {
    return new Promise((resolve, reject) => {
        if (!fs.existsSync(JAVA_BIN)) return reject(`Java not found at ${JAVA_BIN}`);
        
        execFile(JAVA_BIN, ['-jar', JAR_PATH, ...args], (error, stdout, stderr) => {
            if (error) reject(stderr || error.message);
            else resolve(stdout);
        });
    });
}

async function runReportLogic(inputData, pdfOutPath) {
    const dataModel = inputData ? new FitRepData(inputData) : FitRepData.mock();
    const safeName = (dataModel.FullName || "Draft").replace(/[^a-z0-9]/gi, '_').toLowerCase();
    
    const finalPdfPath = pdfOutPath || path.join(USER_OUTPUT_DIR, `Report_${safeName}.pdf`);
    const jsonTempPath = path.join(INTERNAL_DATA_DIR, `temp_${safeName}.json`);

    const mapper = new FitRepMapper();
    mapper.mapDataModel(dataModel);
    mapper.exportJson(jsonTempPath);

    if (!fs.existsSync(PDF_TEMPLATE)) throw new Error(`PDF Template missing at: ${PDF_TEMPLATE}`);
    await PdfFiller.fill(mapper.pdfMap, PDF_TEMPLATE, finalPdfPath);
    
    return finalPdfPath;
}

// --- 4. IPC HANDLERS (Colleague Integrated) ---

// Save to SQLite
ipcMain.handle('save-fitrep', async (e, data) => {
    try {
        const db = new Database(DEFAULTS.SQLITE);
        // Clear old data for this demo/session
        db.exec("DELETE FROM [Reports]; DELETE FROM [Folders]; DELETE FROM [Summary];");
        
        // Setup folder tree
        db.prepare("INSERT INTO [Folders] (FolderName, FolderID, Parent, Active) VALUES (?, ?, ?, ?)")
          .run('Root', 1, 0, 1);
        
        // Insert Report
        const reportStmt = db.prepare(`
            INSERT INTO [Reports] (Parent, ReportType, FullName, SSN, Active) 
            VALUES ('a 1', @ReportType, @FullName, @SSN, 1)
        `);
        reportStmt.run(data);
        
        db.close();
        return { success: true };
    } catch (err) {
        return { success: false, error: err.message };
    }
});

// Export SQLite back to ACCDB via Java
ipcMain.handle('export-accdb', async () => {
    try {
        await runJava(['import', DEFAULTS.SQLITE, DEFAULTS.ACCDB_OUT]);
        return { success: true, path: DEFAULTS.ACCDB_OUT };
    } catch (err) {
        return { success: false, error: err.message };
    }
});

// Generate PDF
ipcMain.handle('generate-report', async (e, reportData) => {
    try {
        const outPath = await runReportLogic(reportData, null);
        return { success: true, path: outPath };
    } catch (err) {
        return { success: false, error: err.message };
    }
});

// --- 5. APP LIFECYCLE (GUI Setup) ---
function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'), 
            contextIsolation: true, 
            nodeIntegration: false
        }
    });

    /**
     * UI Path Logic:
     * Packaged: app.asar/electron2.1/frontend_build/index.html
     * Dev: app.asar/electron2.1/frontend_build/index.html (based on colleague merge)
     */
    const frontendPath = path.join(APP_ROOT, 'electron2.1', 'frontend_build', 'index.html');

    if (!fs.existsSync(frontendPath)) {
        console.error(`ERROR: Frontend not found at ${frontendPath}`);
    }

    win.loadFile(frontendPath).catch(err => console.error("Load Error:", err));
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});