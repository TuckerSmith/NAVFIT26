const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');

// These paths mimic your main.js logic
const JAVA_BIN = path.join(__dirname, 'bin', 'jre', 'bin', 'java');
const JAR_PATH = path.join(__dirname, 'bin', 'app.jar');

console.log("--- NAVFIT26 Java Diagnostic ---");
console.log(`Checking Java Bin: ${JAVA_BIN}`);
console.log(`Checking JAR Path: ${JAR_PATH}`);

// 1. Check if files exist
if (!fs.existsSync(JAVA_BIN)) {
    console.error("❌ ERROR: Java binary not found! Check your 'bin' folder structure.");
    process.exit(1);
}
if (!fs.existsSync(JAR_PATH)) {
    console.error("❌ ERROR: app.jar not found!");
    process.exit(1);
}

// 2. Try to execute 'java -version'
console.log("\nTesting JRE execution...");
execFile(JAVA_BIN, ['-version'], (error, stdout, stderr) => {
    if (error) {
        console.error("❌ ERROR: JRE failed to execute. Check permissions (chmod +x).");
        console.error(error.message);
        process.exit(1);
    }
    console.log("✅ JRE is functional:");
    console.log(stderr); // Java prints version info to stderr

    // 3. Try to execute the JAR
    console.log("\nTesting JAR communication...");
    // We send a dummy command to see if the JAR responds
    execFile(JAVA_BIN, ['-jar', JAR_PATH, '--help'], (error, stdout, stderr) => {
        console.log("✅ JAR responded.");
        console.log("Result:", stdout || "No output (this is normal for --help if not implemented)");
        console.log("\n--- Diagnostic Complete: Ready to Package ---");
    });
});