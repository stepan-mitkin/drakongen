const {drakonToStruct} = require("./drakonToStruct");
const {printPseudo, printWithIndent, makeIndent} = require('./printPseudo');
const {addRange, sortByProperty} = require("./tools")

function drakonToPseudocode(drakonJson, name, filename, htmlToString, translate) {    
    var diagram = drakonToStruct(drakonJson, name, filename, translate)
    var lines = []

    lines.push("## " + translate("Procedure") + " \"" + diagram.name + "\"")
    if (diagram.params) {
        lines.push(translate("Parameters") + ":")
        addRange(lines, htmlToString(diagram.params))
    }    
    lines.push("")
    lines.push(translate("Algorithm") + ":")    
    
    if (diagram.branches.length === 0) {
        lines.push(translate("Empty"))
    } else if (diagram.branches.length === 1) {
        var first = diagram.branches[0]
        printPseudo(first, translate, lines, htmlToString)
    } else {
        var first = diagram.branches[0]
        lines.push(translate("Call subroutine") + ": \"" + htmlToString(first.name) + "\"")
        diagram.branches.forEach(branch => {
            lines.push("")
            lines.push(translate("Subroutine") + ": \"" + htmlToString(branch.name) + "\"")
            printPseudo(branch, translate, lines, htmlToString)
            lines.push(translate("End of subroutine"))
        })
    }  
    lines.push("")
    lines.push(translate("End of procedure"))
    if (diagram.description) {
        lines.push("")       
        addRange(lines, htmlToString(diagram.description))
        lines.push("")       
    }      
    var text = lines.join("\n")
    
    var str = JSON.stringify(diagram, null, 4)
    return {text:text,json:str}
}


function mindToTree(drakonJson, name, filename, htmlToString) {
    let drakonGraph;
    try {
        drakonJson = drakonJson || ""
        drakonJson = drakonJson.trim()
        drakonJson = drakonJson || "{}"
        drakonGraph = JSON.parse(drakonJson);
    } catch (error) {
        var message = translate("Error parsing JSON") + ": " + error.message
        throw createError(message, filename)
    }

    const nodes = drakonGraph.items || {};
    var root = createMindNode("## " + name)
    nodes["root"] = root
    connectMindNodesToParent(nodes)
    sortMindChildren(nodes)
    var lines = []
    printMindNode(root, 0, lines, htmlToString, true)
    lines.push("")
    var text = lines.join("\n")
    return {text:text}
}

function connectMindNodesToParent(nodes) {
    for (var id in nodes) {
        var node = nodes[id]
        if (node.parent) {
            var parent = nodes[node.parent]
            if (!parent.children) {
                parent.children = []
            }
            parent.children.push(node)
        }
    }
}

function sortMindChildren(nodes) {
    for (var id in nodes) {
        var node = nodes[id]
        if (node.children) {
            sortByProperty(node.children, "ordinal")
        }
    }
}

function printMindNode(node, depth, lines, htmlToString, first) {
    var printed = htmlToString(node.content)
    const indent = makeIndent(depth)
    printWithIndent(printed, indent, lines)
    var childDepth = depth + 1
    if (first) {
        lines.push("")
        childDepth = 0
    }
    if (node.children) {
        for (var child of node.children) {
            printMindNode(child, childDepth, lines, htmlToString, false)
        }
    }
}

function createMindNode(name) {
    return {
        "type": "idea",
        "content": "<p>" + name + "</p>",
        "parent": undefined,
        "treeType": "treeview",
        "ordinal": 0
    }
}

module.exports = { drakonToPseudocode, mindToTree };