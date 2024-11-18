function structFlow(nodes, nodeId, branchingStack, filename) {    
    // Step 1: Check for end
    if (!nodeId) return;

    const node = nodes[nodeId];

    // Step 3: Can we continue?
    if (node.prev && node.prev.length > 1) {
        if (!node.stack) {
            node.stack = [];
            node.remaining = node.prev.length;
        }
        node.remaining--;

        // Merge the branching stack into node.stack
        mergeBranchingStack(nodes, node, branchingStack, filename);

        if (node.remaining > 0) return;
    } else {
        node.stack = branchingStack.slice();
    }

    // Step 4: Proceed
    if (node.type === "question") {
        for (let i = 0; i < node.stack.length; i++) {
            const questionId = node.stack[i];
            const question = nodes[questionId];
            question.branching++;
        }

        const stackOne = node.stack.slice();
        const stackTwo = node.stack.slice();
        stackOne.push(nodeId);
        stackTwo.push(nodeId);

        structFlow(nodes, node.one, stackOne, filename);
        structFlow(nodes, node.two, stackTwo, filename);
    } else {
        structFlow(nodes, node.one, node.stack, filename);
    }
}

function mergeBranchingStack(nodes, node, branchingStack, filename) {
    // Append all elements of the branching stack to node.stack
    for (let i = 0; i < branchingStack.length; i++) {
        node.stack.push(branchingStack[i]);
    }

    // Build a dictionary of occurrences
    const dictionary = {};
    for (let i = 0; i < node.stack.length; i++) {
        const id = node.stack[i];
        dictionary[id] = (dictionary[id] || 0) + 1;
    }

    // Merge all nodes
    mergeAll(nodes, node, dictionary, filename);

    // Rebuild the stack
    const rebuiltStack = [];
    for (const id in dictionary) {
        if (dictionary[id] > 0) {
            rebuiltStack.push(id);
        }
    }
    node.stack = rebuiltStack;
}

function mergeAll(nodes, node, dictionary, filename) {
    for (const id in dictionary) {
        const occurrences = dictionary[id];
        if (occurrences > 1) {
            const question = nodes[id];
            question.branching--;
            if (question.branching === 1) {
                dictionary[id] = 0;
                question.next = node.id;
                if (question.parentLoopId && node.parentLoopId !== question.parentLoopId) {
                    markBreak(nodes, node, question, filename)                   
                }                
            } else {
                dictionary[id] = occurrences - 1;
            }
        }
    }
}

function markBreak(nodes, node, question, filename) {
    const parentLoopId = question.parentLoopId
    const start = nodes[parentLoopId];
    const end = nodes[start.end];
    if (end.one === node.id) {
        if (!node.breakingLoops) {
            node.breakingLoops = {}
        }        
        node.breakingLoops[question.parentLoopId] = true
    } else {
        throw new Error(
            `An exit from the loop points too far away, node id = ${node.id}, filename: ${filename}`
        );
    }
}

function makeBreak(nodes, node, pn) {
    const id = makeRandomId(nodes);
    const breakNode = {
        id: id,
        type: "break"
    };
    nodes[id] = breakNode;    
    redirectNode(nodes, pn, node.id, id)
}

function handleBreak(nodes, node, startId) {
    var questions = {}
    var start = nodes[startId]
    const pointingNodes = findPointingNodes(nodes, node, startId, questions);
    for (var qid in questions) {
        var question = nodes[qid]
        if (question.next === node.id) {
            question.next = start.end
        }
    }
    for (var pn of pointingNodes) {
        makeBreak(nodes, node, pn)
    }
}



function findPointingNodes(nodes, node, parentLoopId, questions) {
    const result = [];
    for (let prevId of node.prev) {
        const prev = nodes[prevId];
        if (prev.type === "loopend" && prev.start === parentLoopId) {continue}
        if (tryReachSourceQuestion(nodes, prevId, parentLoopId, questions)) {
            result.push(prev)
        }
    }
    return result;
}

function tryReachSourceQuestion(nodes, nodeId, parentLoopId, questions) {
    const node = nodes[nodeId]
    if (node.type === "branch") {
        return false
    }
    var found = false
    if (node.parentLoopId && node.parentLoopId === parentLoopId) {
        found = true
    } else {
        for (var prevId of node.prev) {
            var foundHere = tryReachSourceQuestion(nodes, prevId, parentLoopId, questions)
            if (foundHere) {found = foundHere}
        }
    }
    if (found && (node.type === "question")) {
        questions[nodeId] = true
    }
    return found
}

function redirectNode(nodes, node, from, to) {
    if (node.one === from) {
        node.one = to;
    }
    if (node.two === from) {
        node.two = to;
    }
    if (node.start && node.type === "loopend") {
        start = nodes[node.start]
        if (start.next === from) {
            start.next = to
        }
    }
}

function makeRandomId(nodes) {
    while (true) {
        const id = generateId();
        if (!nodes[id]) {
            return id;
        }
    }
}

function generateId() {
    return "break-" + Math.floor(Math.random() * (10000 - 1000) + 1000);
}

function prepareQuestions(nodes) {
    for (const nodeId in nodes) {
        const node = nodes[nodeId];
        if (node.type === "question") {
            node.branching = 2;
        } else if (node.type === "arrow-loop") {
            node.branching = 1;
        }
    }
}

function handleBreaks(nodes) {
    for (var id in nodes) {
        var node = nodes[id]
        if (node.breakingLoops) {
            for (var startId in node.breakingLoops) {
                handleBreak(nodes, node, startId)
            }            
        }
    }
}


module.exports = { structFlow, prepareQuestions, handleBreaks };