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
const BASE_DIR = __dirname;
const PROJECT_ROOT = BASE_DIR;

// Java Paths
const JAVA_BIN = IS_PROD
    ? path.join(process.resourcesPath, 'bin', 'jre', 'bin', 'java')
    : path.join(BASE_DIR, 'bin', 'jre', 'bin', 'java');

const JAR_PATH = IS_PROD
    ? path.join(process.resourcesPath, 'bin', 'app.jar')
    : path.join(BASE_DIR, 'bin', 'app.jar');

// PDF Template Path
const PDF_TEMPLATE = IS_PROD
    ? path.join(process.resourcesPath, 'templates', 'navfit_fitrep_report_fillable_template.pdf')
    : path.join(PROJECT_ROOT, 'templates', 'navfit_fitrep_report_fillable_template.pdf');

// --- DYNAMIC USER PATHS ---
const DOCUMENTS_DIR = app.getPath('documents');
const USER_OUTPUT_DIR = IS_PROD
    ? path.join(DOCUMENTS_DIR, 'NavFit_Output')
    : path.join(PROJECT_ROOT, 'output_files');

const INTERNAL_DATA_DIR = IS_PROD
    ? path.join(app.getPath('userData'), 'internal_data')
    : path.join(PROJECT_ROOT, 'output_files');

const DEFAULTS = {
    ACCDB_IN: path.join(PROJECT_ROOT, 'db_files', 'Murphy_example_FITREP.accdb'),
    SQLITE: path.join(INTERNAL_DATA_DIR, 'migrated_reports.db'),
    ACCDB_OUT: path.join(USER_OUTPUT_DIR, 'Murphy_example_FITREP_NEW.accdb'),
    PDF_OUT_DIR: USER_OUTPUT_DIR
};

// Ensure directories exist immediately
if (!fs.existsSync(USER_OUTPUT_DIR)) fs.mkdirSync(USER_OUTPUT_DIR, { recursive: true });
if (!fs.existsSync(INTERNAL_DATA_DIR)) fs.mkdirSync(INTERNAL_DATA_DIR, { recursive: true });


// --- 2. DATABASE LOGIC (Java Required) ---
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

function runJava(args) {
    return new Promise((resolve, reject) => {
        execFile(JAVA_BIN, ['-jar', JAR_PATH, ...args], (error, stdout, stderr) => {
            if (error) {
                reject(stderr || error.message);
            } else {
                resolve(stdout);
            }
        });
    });
}

// --- 3. REPORT LOGIC (Pure JS) ---
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


// --- 4. IPC HANDLERS (The Listeners) ---
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


// --- 5. APP LIFECYCLE (GUI Setup) ---
function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            webSecurity: false,
            // Make sure preload is attached so React can access the listeners!
            preload: path.join(__dirname, 'preload.js') 
        }
    });

    // Use the Vite pathing we fixed earlier
    const frontendPath = path.join(__dirname, 'frontend_build/index.html');
    mainWindow.loadFile(frontendPath);
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
