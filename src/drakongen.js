const { drakonToPseudocode, mindToTree } = require('./drakonToPromptStruct');
const { htmlToString } = require("./browserTools")
const { setUpLanguage, translate } = require("./translate")
const { drakonToStruct } = require("./drakonToStruct");


window.drakongen = {
    toPseudocode: function (drakonJson, name, filename, language) {
        setUpLanguage(language)
        return drakonToPseudocode(drakonJson, name, filename, htmlToString, translate).text
    },

    toMindTree: function (mindJson, name, filename, language) {
        setUpLanguage(language)    
        var result = mindToTree(mindJson, name, filename, htmlToString)
        return result.text
    },    

    toTree: function (drakonJson, name, filename, language) {
        setUpLanguage(language)
        var result = drakonToStruct(drakonJson, name, filename, translate)
        return JSON.stringify(result, null, 4)
    }
}