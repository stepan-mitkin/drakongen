const fs = require('fs/promises');
const path = require('path');
const { spawn } = require('child_process');

// Path to the folder containing the .drakon files
const examplesFolder = path.join(__dirname, 'examples');

// Function to execute a command with a file
function executeCommand(filePath, args) {
    return new Promise((resolve, reject) => {
        const process = spawn('node', args);

        // Handle stdout
        process.stdout.on('data', data => {
            console.log(`Output for ${path.basename(filePath)}: ${data}`);
        });

        // Handle stderr
        process.stderr.on('data', data => {
            console.error(`Error for ${path.basename(filePath)}: ${data}`);
        });

        // Handle process close
        process.on('close', code => {
            if (code === 0) {
                resolve(`Success: ${filePath}`);
            } else {
                reject(new Error(`Process failed for ${filePath} with exit code ${code}`));
            }
        });
    });
}

async function isNoLoopPossible(filePath) {
    var content = await fs.readFile(filePath, "utf-8")
    var diagram = JSON.parse(content)
    if (diagram.items) {
        for (var itemId in diagram.items) {
            var item = diagram.items[itemId]
            if (item.type === "loopbegin" || item.type === "parbegin") {
                return false
            }
        }
    }
    return true
}

async function hasFinal(filePath) {
    var content = await fs.readFile(filePath, "utf-8")
    var diagram = JSON.parse(content)
    if (diagram.items) {
        for (var itemId in diagram.items) {
            var item = diagram.items[itemId]
            if (item.final) {
                return true
            }
        }
    }
    return false
}

async function convertDrakon(filePath) {
    var noLoopPossible = await isNoLoopPossible(filePath)
    var final = await hasFinal(filePath)
    if (!final) {
        await executeCommand(filePath, ['src/main.js', "--output", examplesFolder, filePath])
    }
    if (noLoopPossible && filePath.endsWith(".drakon")) {
        var noLoopFolder = path.join(examplesFolder, "no-loop")
        await executeCommand(filePath, ['src/main.js', "--no-loop", "--output", noLoopFolder, filePath])
        if (final) {return}
        var name = path.basename(filePath).replace(".drakon", ".txt")
        var normal = await fs.readFile(path.join(examplesFolder, name), "utf-8")
        var noloop = await fs.readFile(path.join(noLoopFolder, name), "utf-8")
        if (normal !== noloop) {
            console.log("Discrepancy detected", filePath)
        }
    }
}

// Main function to process .drakon files
async function processDrakonFiles() {
    try {
        // Read all files in the folder
        const files = await fs.readdir(examplesFolder);

        // Filter for .drakon files
        const drakonFiles = files.filter(file => file.endsWith('.drakon') || file.endsWith('.graf') || file.endsWith('.free'));

        // Process each .drakon file
        for (const file of drakonFiles) {
            const filePath = path.join(examplesFolder, file);
            try {
                await convertDrakon(filePath);
                console.log(`Processed file: ${file}`);
            } catch (error) {
                console.error(`Error processing file ${file}: ${error.message}`);
            }
        }

        console.log('All files processed.');
    } catch (err) {
        console.error('Error reading the examples folder:', err.message);
    }
}

// Run the function
processDrakonFiles();
