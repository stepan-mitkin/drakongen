const { handleBreaks, structFlow, prepareQuestions } = require("./structFlow")
const { treeMaker } = require("./treeMaker")

function drakonToStruct(drakonJson, name, filename) {
    let drakonGraph;
    try {
        drakonGraph = JSON.parse(drakonJson);
    } catch (error) {
        throw new Error(`Error parsing JSON in file "${filename}": ${error.message}`);
    }

    const nodes = drakonGraph.items || {};

    var firstNodeId = findStartNode(nodes, filename)

    if (!firstNodeId) {
        return undefined
    }

    buildTwoWayConnections(nodes, firstNodeId)

    rewireSelectsMarkLoops(nodes, filename)
    rewireShortcircuit(nodes, filename)
    rewireArrows(nodes)

    prepareQuestions(nodes)    
    forEachBranch(nodes, cutOffBranch)
    forEachBranch(nodes, branch => structFlow(nodes, branch.next, [], filename))
    handleBreaks(nodes)

    var body = []
    var firstBranch = nodes[firstNodeId]
    treeMaker(nodes, firstBranch.next, body, "none", {})

    return {
        name: name,
        params: drakonGraph.params || "",
        body: body
    }
}

function cutOffBranch(branch) {
    branch.next = branch.one
    branch.one = undefined
}

function forEachBranch(nodes, action) {
    for (var id in nodes) {
        var node = nodes[id]
        if (node.type === "branch") {
            action(node)
        }
    }
}


function buildTwoWayConnections(nodes, firstNodeId) {
    for (var id in nodes) {
        var node = nodes[id]
        node.id = id
        node.prev = []
        node.astack = {}
    }

    traverse(nodes, firstNodeId, {}, connectBack)
}

function findStartNode(nodes, filename) {
    var firstNodeId = undefined
    var minBranchId = 10000    
    for (var id in nodes) {
        var node = nodes[id]
        if (node.type === "branch") {
            if (node.branchId < minBranchId) {
                firstNodeId = id
                minBranchId = node.branchId
            }
        } else if (node.type === "select") {
            if (!node.content) {
                throw new Error(`A Select icon must have content in file "${filename}", node ${id}.`);
            }            
            node.cases = [];
        } else if (node.type === "loopbegin") {
            if (!node.content) {
                throw new Error(`A Loop begin icon must have content in file "${filename}", node ${id}.`);
            }             
        } else if (node.type === "question") {
            if (!node.content) {
                throw new Error(`A Question icon must have content in file "${filename}", node ${id}.`);
            }             
        }
    }

    return firstNodeId
}


function rewireArrows(nodes) {
    for (var id in nodes) {
        var node = nodes[id]
        if (node.type === "branch") {
            var arrowStack = []
            rewireArrowsInBranch(nodes, node.id, node.one, arrowStack)
        }
    }
    for (var id in nodes) {
        var node = nodes[id]
        if (node.type === "arrow-loop") {
            insertArrowStub(nodes, node)
        }
    }    
}

function rewireArrowsInBranch(nodes, prevNodeId, nodeId, arrowStack) {
    if (!nodeId) {return}
    var node = nodes[nodeId]
    if (node.type === "branch") {
        return
    }
    if (node.type === "arrow-loop") {
        if (!node.noloop) {
            node.noloop = {}
        }
        if (arrowStack.includes(nodeId)) {
            return            
        }
        node.noloop[prevNodeId] = true
        arrowStack = arrowStack.slice()
        arrowStack.push(nodeId)
        rewireArrowsInBranch(nodes, nodeId, node.one, arrowStack)
    } else if (node.type === "question") {
        var left = arrowStack.slice()
        var right = arrowStack.slice()
        rewireArrowsInBranch(nodes, nodeId, node.one, left)
        rewireArrowsInBranch(nodes, nodeId, node.two, right)
    } else {
        rewireArrowsInBranch(nodes, nodeId, node.one, arrowStack)
    }
}

function insertArrowStub(nodes, node) {
    var stub = {
        id: "arrow-stub-" + node.id,
        arrow: node.id,
        prev: []
    }
    nodes[stub.id] = stub
    node.stub = stub.id
    var prev2 = []
    for (var prevId of node.prev) {
        if (prevId in node.noloop) {
            prev2.push(prevId)
        } else {
            stub.prev.push(prevId)
            var prev = nodes[prevId]
            if (prev.one === node.id) {
                prev.one = stub.id
            }
            if (prev.two === node.id) {
                prev.two = stub.id
            }
        }
    }
    node.prev = prev2
}

function rewireSelectsMarkLoops(nodes, filename) {
    for (var id of Object.keys(nodes)) {
        var node = nodes[id]
        if (node.type === "select") {
            rewireSelect(nodes, node, filename)
        } else if (node.type === "loopbegin") {
            markLoopBody(nodes, node, filename)
        }
    }
}

function rewireSelect(nodes, selectNode, filename) {
    var caseNodeId = selectNode.one
    while (caseNodeId) {
        var caseNode = nodes[caseNodeId]
        caseNodeId = caseNode.two
        if (caseNode.content) {
            caseNode.type = "question"
            caseNode.flag1 = 1
            caseNode.content = {operator: "equal", left:selectNode.content, right:caseNode.content}
            if (!caseNode.two) {
                var errorId = caseNode.id + "-unexpected"
                var errorAction = insertIcon(nodes, "error", errorId,  selectNode.content)
                errorAction.message = "Unexpected case value"

                caseNode.two = errorId
                errorAction.prev.push(caseNode.id)
                errorAction.one = caseNode.one

                var next = nodes[caseNode.one]
                next.prev.push(errorId)
            }
        } else {
            if (caseNode.two) {
                throw new Error("Error in " + filename + ": Only the rightmost Case icon can be empty, nodeId = " + caseNode.id)
            }
            removeNodeOne(nodes, caseNode.id)
        }
    }
    removeNodeOne(nodes, selectNode.id)
}

function insertIcon(nodes, type, id, content) {
    var node = {
        type: type,
        id: id,
        content: content,
        prev: []
    }
    nodes[id] = node
    return node
}

function removeNodeOne(nodes, nodeId) {
    var node = nodes[nodeId]
    redirectPrev(nodes, node, node.one)
    redirectNext(nodes, node, node.one)
    delete nodes[nodeId]
}

function removeFromNext(node, next) {
    next.prev = next.prev.filter(prevId => prevId !== node.id)
}

function redirectPrev(nodes, node, newTarget) {
    for (var prevId of node.prev) {
        var prev = nodes[prevId]
        if (prev.one === node.id) {
            prev.one = newTarget
        }
        if (prev.two === node.id) {
            prev.two = newTarget
        }      
    }
}

function redirectNext(nodes, node, newTarget) {
    var target = nodes[newTarget]
    removeFromNext(node, target)
    for (var prevId of node.prev) {
        target.prev.push(prevId)
    }
}

function rewireShortcircuit(nodes) {
    while (findShortcusts(nodes)) {

    }
}

function findShortcusts(nodes) {
    for (var id in nodes) {
        var node = nodes[id]
        if (node.type === "question") {
            var andOperand = findAndOperand(nodes, node)
            if (andOperand) {
                writeAndShortcut(nodes, node, andOperand)
                return true
            }
            var orOperand = findOrOperand(nodes, node)
            if (orOperand) {
                writeOrShortcut(nodes, node, orOperand)
                return true
            }            
        }
    }
    return false
}

function findAndOperand(nodes, node) {
    var below = nodes[node.one]
    if (below.type === "question") {
        if (below.prev.length === 1 && below.two === node.two) {
            return below
        }
    }
    return undefined
}

function findOrOperand(nodes, node) {
    var right = nodes[node.two]
    if (right.type === "question") {
        if (right.prev.length === 1 && right.one === node.one) {
            return right
        }
    }
    return undefined
}

function writeAndShortcut(nodes, node, andOperand) {
    var right = nodes[node.two]
    var down = nodes[andOperand.one]
    removeFromNext(andOperand, right)
    removeFromNext(andOperand, down)
    node.content = {
        operator: "and",
        left: normalizeContent(node),
        right: normalizeContent(andOperand)
    }
    node.one = down.id
    node.flag1 = 1
    down.prev.push(node.id)
    delete nodes[andOperand.id]
}

function writeOrShortcut(nodes, node, orOperand) {
    var right = nodes[orOperand.two]
    var down = nodes[orOperand.one]
    removeFromNext(orOperand, right)
    removeFromNext(orOperand, down)
    node.content = {
        operator: "or",
        left: normalizeContent(node),
        right: normalizeContent(orOperand)
    }
    node.two = right.id
    node.flag1 = 1
    right.prev.push(node.id)
    delete nodes[orOperand.id]
}

function normalizeContent(question) {
    if (question.flag1 === 1) {
        return question.content
    }

    return {
        operator: "not",
        operand: question.content
    }
}


function traverse(nodes, nodeId, visited, action) {
    if (!nodeId) {
        return
    }

    if (nodeId in visited) {
        return
    }
    visited[nodeId] = true
    var node = nodes[nodeId]
    action(nodes, node)
    traverse(nodes, node.one, visited, action)
    traverse(nodes, node.two, visited, action)
}

function connectBack(nodes, node) {
    if (node.one) {
        var one = nodes[node.one]
        one.prev.push(node.id)
    }
    if (node.two) {
        var two = nodes[node.two]
        two.prev.push(node.id)
    }    
}

function markLoopBody(nodes, start, filename) {
    var nextNodeId = start.one
    while (nextNodeId) {
        var current = nodes[nextNodeId]
        nextNodeId = current.one
        current.parentLoopId = start.id
        if (current.type === "loopbegin") {
            nextNodeId = markLoopBody(nodes, current, filename)
        } else if (current.type === "loopend") {
            start.end = current.id
            start.next = current.one
            current.start = start.id
            return nextNodeId
        }
    }
    throw new Error(`Loop end expected here "${filename}".`);
}

function visitSelect(nodes, nodeId, cases) {
    if (!nodeId) return;
    const node = nodes[nodeId];
    cases.push({ value: node.content, next: node.one });
    visitSelect(nodes, node.two, cases);
}

module.exports = { drakonToStruct };