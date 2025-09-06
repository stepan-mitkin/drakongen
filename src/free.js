var {addRange} = require("./tools")
const { createError } = require("./tools");

var translate

function compareVertically(box1, box2) {
  if (box1.top + box1.height <= box2.top) return -1;
  if (box2.top + box2.height <= box1.top) return 1;
  return 0;
}

function compareHorizontally(box1, box2) {
  if (box1.left + box1.width <= box2.left) return -1;
  if (box2.left + box2.width <= box1.left) return 1;
  return 0;
}

function byTopLeft(box1, box2) {
    var vertical = compareVertically(box1, box2)
    if (vertical == 0) {
        return compareHorizontally(box1, box2)
    }
    return vertical
}

function parseDiagram(freeJson, filename) {
    let diagram;
    try {
        freeJson = freeJson || ""
        freeJson = freeJson.trim()
        freeJson = freeJson || "{}"
        diagram = JSON.parse(freeJson);
    } catch (error) {
        var message = translate("Error parsing JSON") + ": " + error.message
        throw createError(message, filename)
    }    
    return diagram
}

function sortedItems(diagram) {    
    var items = diagram.items || {};
    var result = [];
    for (var id in items) {
        var item = items[id];
        if (item.content && item.top && item.left && item.width && item.height) {
            result.push(item);
        }
    }
    result.sort(byTopLeft);
    return result;
}

function freeDiagramToText(freeJson, name, filename, translateFunction, htmlToString) {
    translate = translateFunction
    var diagram = parseDiagram(freeJson, filename)
    var sorted = sortedItems(diagram)
    var lines = []
    lines.push("## " + name)
    lines.push("")
    for (var item of sorted) {
        var content = htmlToString(item.content)
        addRange(lines, content)
        lines.push("")
    }
    var text = lines.join("\n")
    return {text:text}
}

module.exports = {freeDiagramToText}