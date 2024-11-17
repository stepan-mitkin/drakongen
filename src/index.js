// Import the drakonToPromptStruct function from the specified module
const { drakonToPromptStruct } = require('./drakonToPromptStruct');
const fs = require('fs').promises;
const path = require('path');

async function processFile(filePath) {
    try {
        // Read the content of the file with UTF-8 encoding
        const content = await fs.readFile(filePath, 'utf8');

        var pname = path.parse(filePath)

        const outputFilePathJson = path.join(pname.dir, pname.name + ".json")
        const outputFilePathTxt = path.join(pname.dir, pname.name + ".txt")
        const name = pname.name
        // Call the drakonToPromptStruct function with the file content and filename
        const result = drakonToPromptStruct(content, name, filePath);


        // Write the result to a new file in UTF-8 encoding
        await fs.writeFile(outputFilePathJson, result.json, 'utf8');
        await fs.writeFile(outputFilePathTxt, result.text, 'utf8');
    } catch (error) {
        console.error(`Error: ${error.message}`);
        console.error(error.stack);
    }
}

// Check for the required command line argument
const filePath = process.argv[2];
if (!filePath) {
    console.error('Please provide the path to a file as the command line argument.');
    process.exit(1);
}

// Call the main function with the provided file path
processFile(filePath).catch((error) => {
    console.error(`Uncaught exception: ${error.message}`);
    console.error(error.stack);
});