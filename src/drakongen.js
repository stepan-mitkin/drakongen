const { drakonToPseudocode, mindToTree } = require("./drakonToPromptStruct");
const { htmlToString } = require("./browserTools");
const { setUpLanguage, translate } = require("./translate");
const { treeToScenarios, printScenarios } = require("./scenarios");
const { drakonToStruct } = require("./drakonToStruct");
const { freeDiagramToText } = require("./free");

window.drakongen = {
  toPseudocode: function (drakonJson, name, filename, language) {
    setUpLanguage(language);
    return drakonToPseudocode(
      drakonJson,
      name,
      filename,
      htmlToString,
      translate,
    ).text;
  },

  toMindTree: function (mindJson, name, filename, language) {
    setUpLanguage(language);
    var result = mindToTree(mindJson, name, filename, htmlToString, false);
    return result.text;
  },

  toMindTreeJson: function (mindJson, name, filename, language) {
    setUpLanguage(language);
    var result = mindToTree(mindJson, name, filename, htmlToString, true);
    return result.text;
  },

  freeToText: function (freeJson, name, filename, language) {
    setUpLanguage(language);
    var result = freeDiagramToText(
      freeJson,
      name,
      filename,
      translate,
      htmlToString,
    );
    return result.text;
  },

  toTree: function (drakonJson, name, filename, language, options) {
    setUpLanguage(language);
    var result = drakonToStruct(
      drakonJson,
      name,
      filename,
      translate,
      htmlToString,
      options,
    );
    return JSON.stringify(result, null, 4);
  },

  makeScenarios: function (drakonJson, name, filename, language) {
    setUpLanguage(language);
    var scenarios = treeToScenarios(
      drakonJson,
      name,
      filename,
      translate,
      htmlToString
    );
    return printScenarios(
      scenarios,
      name,
      translate
    );
  },
  makeScenariosJson: function (drakonJson, name, filename, language) {
    setUpLanguage(language);
    var result = treeToScenarios(
      drakonJson,
      name,
      filename,
      translate,
      htmlToString
    );
    return JSON.stringify(result, null, 4);
  },   
};
