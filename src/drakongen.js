const { drakonToPseudocode } = require('./drakonToPromptStruct');
var {htmlToString} = require("./browserTools")


window.drakonToPseudocode = function(drakonJson, name, filename, language) {
    return drakonToPseudocode(drakonJson, name, filename, htmlToString, language).text
}