const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { execFile } = require('child_process');

// Logic Modules
const FitRepData = require('../backend2.1/FitRepData');
const FitRepMapper = require('../backend2.1/FitRepMapper');
const PdfFiller = require('../backend2.1/PdfFiller');

// --- 1. CONFIGURATION & PATHS ---
const IS_PROD = app.isPackaged;

// In Dev: This is /your/path/NAVFIT26/electron2.1
// In Prod: This is /tmp/.mount_xxx/resources/app.asar/electron2.1
const BASE_DIR = __dirname;

// CRITICAL FIX: app.getAppPath() always points to the root of the app code
// In Prod: /resources/app.asar
// In Dev: /your/path/NAVFIT26
const APP_ROOT = app.getAppPath();

// --- 2. ASSET PATHING (Java & Templates) ---
// These live in the 'resources' folder next to the ASAR when packaged
const EXTERNAL_RESOURCES = IS_PROD 
    ? process.resourcesPath 
    : APP_ROOT;

const JAVA_BIN = path.join(EXTERNAL_RESOURCES, 'bin', 'jre', 'bin', 'java');
const JAR_PATH = path.join(EXTERNAL_RESOURCES, 'bin', 'app.jar');

// PDF & DB Files (Preserved stubs)
const PDF_TEMPLATE = path.join(EXTERNAL_RESOURCES, 'templates', 'navfit_fitrep_report_fillable_template.pdf');

// --- 3. DYNAMIC USER PATHS ---
const DOCUMENTS_DIR = app.getPath('documents');
const USER_OUTPUT_DIR = path.join(DOCUMENTS_DIR, 'NavFit_Output');
const INTERNAL_DATA_DIR = path.join(app.getPath('userData'), 'internal_data');

// Ensure directories exist immediately
if (!fs.existsSync(USER_OUTPUT_DIR)) fs.mkdirSync(USER_OUTPUT_DIR, { recursive: true });
if (!fs.existsSync(INTERNAL_DATA_DIR)) fs.mkdirSync(INTERNAL_DATA_DIR, { recursive: true });

const DEFAULTS = {
    ACCDB_IN: path.join(EXTERNAL_RESOURCES, 'db_files', 'Murphy_example_FITREP.accdb'),
    SQLITE: path.join(INTERNAL_DATA_DIR, 'migrated_reports.db'),
    ACCDB_OUT: path.join(USER_OUTPUT_DIR, 'Murphy_example_FITREP_NEW.accdb'),
    PDF_OUT_DIR: USER_OUTPUT_DIR
};

// --- 4. JAVA & REPORT LOGIC ---
function runJava(args) {
    return new Promise((resolve, reject) => {
        if (!fs.existsSync(JAVA_BIN)) return reject(`Java not found at ${JAVA_BIN}`);
        execFile(JAVA_BIN, ['-jar', JAR_PATH, ...args], (error, stdout, stderr) => {
            if (error) {
                reject(stderr || error.message);
            } else {
                resolve(stdout);
            }
        });
    });
}

async function runExportLogic(source, target) {
    const input = source || DEFAULTS.ACCDB_IN;
    const output = target || DEFAULTS.SQLITE;
    const outDir = path.dirname(output);
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    return await runJava(['export', input, output]);
}

async function runImportLogic(source, target) {
    const input = source || DEFAULTS.SQLITE;
    const output = target || DEFAULTS.ACCDB_OUT;
    const outDir = path.dirname(output);
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    return await runJava(['import', input, output]);
}

async function runReportLogic(inputData, pdfOutPath) {
    let dataModel = inputData ? new FitRepData(inputData) : FitRepData.mock();
    const safeName = (dataModel.FullName || "Draft_Report").replace(/[^a-z0-9]/gi, '_').toLowerCase();
    
    const finalPdfPath = pdfOutPath || path.join(DEFAULTS.PDF_OUT_DIR, `Report_${safeName}.pdf`);
    const jsonTempPath = path.join(INTERNAL_DATA_DIR, `temp_data_${safeName}_${Date.now()}.json`);

    const mapper = new FitRepMapper();
    mapper.mapDataModel(dataModel);
    mapper.exportJson(jsonTempPath);

    if (!fs.existsSync(PDF_TEMPLATE)) throw new Error(`PDF Template missing at: ${PDF_TEMPLATE}`);
    await PdfFiller.fill(mapper.pdfMap, PDF_TEMPLATE, finalPdfPath);
    
    return finalPdfPath;
}

// --- 5. IPC HANDLERS ---
ipcMain.handle('export-accdb', async (e, src, tgt) => {
    try {
        await runExportLogic(src, tgt);
        return { success: true, path: tgt || DEFAULTS.SQLITE };
    } catch (err) { return { success: false, error: err.message }; }
});

ipcMain.handle('import-accdb', async (e, src, tgt) => {
    try {
        await runImportLogic(src, tgt);
        return { success: true, path: tgt || DEFAULTS.ACCDB_OUT };
    } catch (err) { return { success: false, error: err.message }; }
});

ipcMain.handle('generate-report', async (e, reportData) => {
    try {
        const outPath = await runReportLogic(reportData, null);
        return { success: true, path: outPath };
    } catch (err) { return { success: false, error: err.message }; }
});

// --- 6. APP LIFECYCLE (GUI Setup) ---
function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            webSecurity: false,
            preload: path.join(BASE_DIR, 'preload.js') 
        }
    });

    /**
     * UI PATHING FIX:
     * We use app.getAppPath() to start from the root of the ASAR.
     * Packaged structure: /resources/app.asar/frontend_build/index.html
     * Dev structure: /NAVFIT26/frontend2.1/dist/index.html
     */
    const frontendPath = IS_PROD
        ? path.join(APP_ROOT, 'frontend_build', 'index.html')
        : path.join(APP_ROOT, 'frontend2.1', 'dist', 'index.html');

    console.log(`Loading UI from: ${frontendPath}`);
    mainWindow.loadFile(frontendPath).catch(err => {
        console.error("Failed to load UI:", err);
    });
}

app.whenReady().then(() => {
    createWindow();
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});