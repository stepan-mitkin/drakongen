const path = require('path');
const { parse } = require('node-html-parser');
const {drakonToStruct} = require("./drakonToStruct");
const { printPseudo } = require('./printPseudo');

const translations = {
    "error": "ERROR",
    "not": "not",
    "and": "and",
    "or": "or",
    "if": "If",
    "else": "Else",
    "empty": "EMPTY",
    "loop forever": "Loop forever",
    "pass": "Pass"
};

function drakonToPromptStruct(drakonJson, name, filename) {

    var diagram = drakonToStruct(drakonJson, name, filename)
    var lines = []
    printPseudo(diagram, translations, lines)
    var text = lines.join("\n")
    
    var str = JSON.stringify(diagram, null, 4)
    return {text:text,json:str}
}


module.exports = { drakonToPromptStruct };