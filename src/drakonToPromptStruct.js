const path = require('path');
const { parse } = require('node-html-parser');
const {drakonToStruct} = require("./drakonToStruct");
const { printPseudo } = require('./printPseudo');

const translations = {
    "Error": "ERROR",
    "not": "not",
    "and": "and",
    "or": "or",
    "If": "If",
    "Else": "Else",
    "empty": "EMPTY"
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