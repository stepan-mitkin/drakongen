#!/usr/bin/env node

const {toTree, toPseudocode, toMindTree} = require("./index")
const package = require("../package.json")

const fs = require('fs').promises;
const path = require('path');

// Display usage summary
function displayUsage() {
    console.log("drakongen " + package.version)
    console.log(`Usage:
    drakongen <path>                      Read from <path> and output to standard output
    drakongen --language <lang> <path>    Read from <path> and output to standard output, use the provided language
    drakongen --tree <path>               Read from <path> and output to standard output, use the JSON-tree format
    drakongen --output <output folder> --project <path> Run in the project mode. 
    drakongen --output <output folder> <path> 
                                      Read from <path> and write to <output folder>
    drakongen                             Display this usage summary.`);
}



// Main logic
async function main() {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        displayUsage();
        return;
    }

    let options = {
        language: "en",
        project: false,
        json: false,
        output: null,
        tree: false
    };
    let targetPath = null;

    for (let i = 0; i < args.length; i++) {
        switch (args[i]) {
            case '--language':
                options.language = args[++i];
                break;
            case '--tree':
                options.tree = true;
                break;
            case '--project':
                options.project = true;
                break;                
            case '--output':
                options.output = args[++i];
                break;
            default:
                if (!targetPath) {
                    targetPath = args[i];
                }
        }
    }

    if (!targetPath) {
        displayUsage();
        return;
    }

    try {
        if (options.project) {
            await generateProject(targetPath, options)
        } else {
            const stats = await fs.lstat(targetPath);
            if (stats.isDirectory()) {
                await generate(targetPath, options);
            } else {
                await generateOne(targetPath, options);
            }
        }
    } catch (err) {
        console.error(`${err.message}`);
        console.error(`Filename: ${err.filename}`);
        console.error(`Node id: ${err.nodeId}`);
        console.error(`Stack trace: ${err.stack}`);
        process.exit(1);
    }
}

async function getDrakonFiles(dirPath) {    
    // Read all entries in the directory
    const files = await fs.readdir(dirPath, { withFileTypes: true });

    // Filter files that are regular files and have a .txt extension, then map to full paths
    const txtFiles = files
        .filter(file => file.isFile() && (path.extname(file.name) === '.drakon' || path.extname(file.name) === '.graf' || path.extname(file.name) === '.txt'))
        .map(file => path.join(dirPath, file.name));

    return txtFiles;
}

async function generate(folderPath, options) {
    var files = await getDrakonFiles(folderPath)
    var output
    if (options.tree) {
        var obj = {procedures:[]}
        for (var file of files) {
            var json = await convertToTree(file, options)
            obj.procedures.push(json)
        }     
        output = JSON.stringify(obj, null, 4)   
    } else {
        output = ""
        for (var file of files) {
            var pseudo = await convertToPseudo(file, options)
            output += (pseudo + "\n\n\n")
        }
    }
    await writeOut(output, folderPath, options.output)
}

async function generateOne(filePath, options) {
    var output
    if (options.tree) {
        var json = await convertToTree(filePath, options)
        output = JSON.stringify(json, null, 4)   
    } else {
        output = await convertToPseudo(filePath, options)
    }
    await writeOut(output, filePath, options.output)
}

async function writeOut(content, inputPath, outputFolder) {
    if (outputFolder) {
        var pname = path.parse(inputPath)
        var fullName = path.join(outputFolder, pname.name + ".txt")
        await fs.writeFile(fullName, content, 'utf8');
    } else {
        console.log(content)
    }
}

async function convertToTree(filePath, options) {
    // Read the content of the file with UTF-8 encoding
    const content = await fs.readFile(filePath, 'utf8');

    var pname = path.parse(filePath)
    const name = pname.name    
    var result = toTree(content, name, filePath, options.language)
    return JSON.parse(result)
}


async function convertToPseudo(filePath, options) {
    // Read the content of the file with UTF-8 encoding
    const content = await fs.readFile(filePath, 'utf8');
    var pname = path.parse(filePath)
    const name = pname.name
    var result
    if (pname.ext == ".drakon") {
        result = toPseudocode(content, name, filePath, options.language);
    } else if (pname.ext == ".graf") {
        result = toMindTree(content, name, filePath, options.language);
    } else if (pname.ext == ".txt") {
        result = content       
    } else {
        return ""
    }
    return result
}

async function processFile(filename, options, output) {
    const pseudo = await convertToPseudo(filename, options);
    output.push(pseudo);
    output.push('');
    output.push('');
}

async function processFolder(filename, options, output) {
    const name = path.basename(filename);
    if (name.startsWith('.')) {
        return
    }
    const filenames = await fs.readdir(filename);
    for (const name of filenames) {
        const fullPath = path.join(filename, name);
        const stats = await fs.stat(fullPath);
        if (stats.isDirectory()) {
            await processFolder(fullPath, options, output);
        } else {
            await processFile(fullPath, options, output);
        }
    }
}

async function generateProject(targetPath, options) {
    // Read project file
    const projectContent = await fs.readFile(targetPath, 'utf8');
    const lines = projectContent.split('\n');
    const items = lines.map(line => line.trim()).filter(line => line.length > 0);
    const output = [];

    // Convert files
    for (const item of items) {
        const fullPath = path.normalize(path.join(path.dirname(targetPath), item));
        const stats = await fs.stat(fullPath);
        if (stats.isDirectory()) {
            await processFolder(fullPath, options, output);
        } else {
            await processFile(fullPath, options, output);
        }
    }
    const content = output.join("\n")
    // Write the output file
    await writeOut(content, targetPath, options.output);
}

// Entry point
main();


