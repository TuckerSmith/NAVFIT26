const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { execFile } = require('child_process');
const Database = require('better-sqlite3');

const IS_PROD = app.isPackaged;
const BASE_DIR = __dirname;
const PROJECT_ROOT = BASE_DIR;

const FitRepData = IS_PROD 
    ? require('./backend_src/FitRepData') 
    : require('../backend2.1/src/FitRepData');

const FitRepMapper = IS_PROD 
    ? require('./backend_src/FitRepMapper') 
    : require('../backend2.1/src/FitRepMapper');

const PdfFiller = IS_PROD 
    ? require('./backend_src/PdfFiller') 
    : require('../backend2.1/src/PdfFiller');

// --- 1. CONFIGURATION & PATHS ---


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

// --- 1. DYNAMIC USER PATHS ---
const DOCUMENTS_DIR = app.getPath('documents');
const USER_DATA_DIR = app.getPath('userData');

// Dev = local project folder. Prod = user's Documents folder.
const INTERNAL_DATA_DIR = IS_PROD
    ? path.join(USER_DATA_DIR, 'working_data')
    : path.join(BASE_DIR, 'working_data');

const OUTWARD_DIR = IS_PROD
    ? path.join(DOCUMENTS_DIR, 'NavFit_Output')
    : path.join(BASE_DIR, 'output_files');

// 3. ENSURE DIRECTORIES EXIST
[OUTWARD_DIR, INTERNAL_DATA_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// 4. DEFAULTS MAPPING
const DEFAULTS = {
    ACCDB_IN: IS_PROD
        ? path.join(process.resourcesPath, 'bin', 'Murphy_example_FITREP.accdb')
        : path.join(BASE_DIR, 'bin', 'Murphy_example_FITREP.accdb'),
        
    SQLITE: path.join(INTERNAL_DATA_DIR, 'migrated_reports.db'),
    
    ACCDB_OUT: path.join(OUTWARD_DIR, 'Generated_FITREP.accdb'),
    PDF_OUT_DIR: OUTWARD_DIR
};

// --- DATABASE SEEDING LOGIC ---
const SQLITE_TEMPLATE = IS_PROD
    ? path.join(process.resourcesPath, 'templates', 'database_template.db')
    : path.join(PROJECT_ROOT, 'templates', 'database_template.db');

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
ipcMain.handle('save-fitrep', async (e, data) => {
    try {
        const dbDir = path.dirname(DEFAULTS.SQLITE);
        if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, { recursive: true });
        }
        if (!fs.existsSync(DEFAULTS.SQLITE)) {
            const SQLITE_TEMPLATE = IS_PROD
                ? path.join(process.resourcesPath, 'templates', 'database_template.db')
                : path.join(BASE_DIR, 'templates', 'database_template.db');
            
            // Double-check the template actually packaged correctly
            if (!fs.existsSync(SQLITE_TEMPLATE)) {
                throw new Error(`CRITICAL: Template DB missing at ${SQLITE_TEMPLATE}`);
            }
            
            fs.copyFileSync(SQLITE_TEMPLATE, DEFAULTS.SQLITE);
            console.log("Successfully seeded working database from template.");
        }

        const db = new Database(DEFAULTS.SQLITE);
        
        // 1. Wipe all data to prevent folder/report duplication
        db.exec("DELETE FROM [Reports]; DELETE FROM [Folders]; DELETE FROM [Summary];");

        // 2. Create the "Root" container (FolderID 1)
        // NAVFIT98 requires this as the anchor for the navigation tree
        db.prepare(`
            INSERT INTO [Folders] (FolderName, FolderID, Parent, Active)
            VALUES (?, ?, ?, ?)
        `).run('Root', 1, 0, 1);

        // 3. Insert the Report directly into the Reports Table
        // We link to 'a 1' which NAVFIT uses to display reports at the root level
        const reportStmt = db.prepare(`
            INSERT INTO [Reports] (
                Parent, ReportType, FullName, FirstName, MI, LastName, Suffix,
                Rate, Desig, SSN, Active, TAR, Inactive, ATADSW, UIC, ShipStation, 
                PromotionStatus, DateReported, Periodic, DetInd, Frocking, Special, 
                FromDate, ToDate, NOB, Regular, Concurrent, OpsCdr, 
                ReportingSenior, RSGrade, RSDesig, RSTitle, RSUIC, RSSSN, RSAddress,
                Achievements, PrimaryDuty, Duties, DateCounseled, 
                PROF, QUAL, EO, MIL, PA, TEAM, LEAD, MIS, TAC,
                RecommendA, RecommendB, Comments, PromotionRecom
            ) VALUES (
                'a 1', -- Virtual link to the Root structure
                @ReportType, @FullName, @FirstName, @MI, @LastName, @Suffix,
                @Rate, @Desig, @SSN, 1, @TAR, @Inactive, @ATADSW, @UIC, @ShipStation,
                @PromotionStatus, @DateReported, @Periodic, @DetInd, @Frocking, @Special,
                @FromDate, @ToDate, @NOB, @Regular, @Concurrent, @OpsCdr,
                @ReportingSenior, @RSGrade, @RSDesig, @RSTitle, @RSUIC, @RSSSN, @RSAddress,
                @Achievements, @PrimaryDuty, @Duties, @DateCounseled,
                @PROF, @QUAL, @EO, @MIL, @PA, @TEAM, @LEAD, @MIS, @TAC,
                @RecommendA, @RecommendB, @Comments, @PromotionRecom
            )
        `);
        
        reportStmt.run(data);
        db.close();
        return { success: true };
    } catch (err) { 
        console.error("Save Error:", err);
        return { success: false, error: err.message }; 
    }
});

// 2. OUTWARD EXPORT: Copies the internal database to the user's Documents folder
ipcMain.handle('export-sqlite', async (e) => {
    try {
        // Step 1: Ensure the internal database actually exists before trying to copy it
        if (!fs.existsSync(DEFAULTS.SQLITE)) {
            throw new Error("No internal database found. Please save the FitRep first.");
        }

        // Step 2: Open the internal DB just to read the Name and UIC for the filename
        const db = new Database(DEFAULTS.SQLITE, { readonly: true });
        const report = db.prepare("SELECT FullName, UIC FROM [Reports] LIMIT 1").get();
        db.close();

        // Step 3: Construct the dynamic filename
        let outputFileName = 'Generated_FITREP.sqlite'; // Fallback
        if (report) {
            const namePart = report.FullName || "Draft";
            const uicPart = report.UIC || "NoUIC";
            const safeName = `${namePart}_${uicPart}`.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            outputFileName = `FITREP_${safeName}.sqlite`;
        }

        const outDbPath = path.join(OUTWARD_DIR, outputFileName); // Note: Assuming OUTWARD_DIR from our previous step

        // Step 4: Copy the file to the user's output directory
        fs.copyFileSync(DEFAULTS.SQLITE, outDbPath);
        console.log(`Successfully exported SQLite to: ${outDbPath}`);

        return { success: true, path: outDbPath };
    } catch (err) { 
        console.error("Export SQLite Error:", err);
        return { success: false, error: err.message }; 
    }
});

// 2. Export ACCDB (Java trigger)
ipcMain.handle('export-accdb', async (e) => {
    try {
        const fileName = generateDynamicName('accdb');
        const dynamicAccdbOut = path.join(OUTWARD_DIR, fileName);
        await runImportLogic(DEFAULTS.SQLITE, dynamicAccdbOut);
        return { success: true, path: dynamicAccdbOut };
    } catch (err) {
         
        return { success: false, error: err.message }; }
});

// THE HELPER FUNCTION
function generateDynamicName(extension) {
    try {
        const db = new Database(DEFAULTS.SQLITE, { readonly: true });
        const report = db.prepare("SELECT FullName, FirstName, LastName, UIC FROM [Reports] LIMIT 1").get();
        db.close();

        let namePart = "Draft";
        let uicPart = "NoUIC";

        if (report) {
            if (report.FullName) namePart = report.FullName;
            else if (report.LastName || report.FirstName) {
                namePart = `${report.LastName || ""}_${report.FirstName || ""}`.replace(/^_|_$/g, ''); 
            }
            uicPart = report.UIC || "NoUIC";
        }

        const safeName = `${namePart}_${uicPart}`.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        return `FITREP_${safeName}.${extension}`;
        
    } catch (err) {
        return `Generated_FITREP.${extension}`; // Absolute foolproof fallback
    }
}

// 3. Generate PDF
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
            preload: path.join(__dirname, 'preload.js'), 
            contextIsolation: true, 
            nodeIntegration: false, 
            webSecurity: true 
        }
    });

    // 1. Resolve the path absolutely
    const frontendPath = path.resolve(__dirname, 'frontend_build', 'index.html');

    // 2. Debug check: Log to terminal so you can see where it's looking
    if (!fs.existsSync(frontendPath)) {
        console.error(`ERROR: Cannot find frontend build at: ${frontendPath}`);
        console.log("Did you run 'npm run build' in your React folder and move it here?");
    }

    mainWindow.loadFile(frontendPath).catch(err => {
        console.error("Failed to load file:", err);
    });
    mainWindow.webContents.openDevTools();
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
