const { drakonToPseudocode, mindToTree } = require('./drakonToPromptStruct');
const { htmlToString } = require("./nodeTools")
const { setUpLanguage, translate } = require("./translate")
const { drakonToStruct } = require("./drakonToStruct");
const { freeDiagramToText } = require("./free");

function toPseudocode(drakonJson, name, filename, language) {
    setUpLanguage(language)    
    var result = drakonToPseudocode(drakonJson, name, filename, htmlToString, translate)
    return result.text
}

function toMindTree(mindJson, name, filename, language) {
    setUpLanguage(language)    
    var result = mindToTree(mindJson, name, filename, htmlToString)
    return result.text
}

function freeToText(mindJson, name, filename, language) {
    setUpLanguage(language)    
    var result = freeDiagramToText(mindJson, name, filename, translate, htmlToString)
    return result.text
}

function toTree(drakonJson, name, filename, language) {
    setUpLanguage(language)
    var result = drakonToStruct(drakonJson, name, filename, translate, htmlToString)
    return JSON.stringify(result, null, 4)
}
module.exports = { toPseudocode, toTree, toMindTree, freeToText }