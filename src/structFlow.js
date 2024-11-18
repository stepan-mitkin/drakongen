function structFlow(nodes, nodeId, branchingStack, filename) {    
    // Step 1: Check for end
    if (!nodeId) return;

    const node = nodes[nodeId];

    if (!node.stack) {
        node.stack = [];
        node.remaining = node.prev.length;
    }
    node.remaining--;

    // Merge the branching stack into node.stack
    mergeBranchingStack(nodes, node, branchingStack, filename);
    if (node.remaining > 0) return;

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

        structFlow(nodes, node.two, stackTwo, filename);
        structFlow(nodes, node.one, stackOne, filename);
    } else if (node.type === "arrow-loop") {
        const stack = node.stack.slice();
        stack.push(nodeId);
        structFlow(nodes, node.one, stack, filename);
    } else if (node.type === "arrow-stub") {
        decrementBranchingForAll(nodes, node)
    } else {
        structFlow(nodes, node.one, node.stack, filename);
    }
}

function decrementBranchingForAll(nodes, node) {
    for (var id of node.stack) {
        var algonode = nodes[id]
        algonode.branching--
    }
}

function isInMap(map, key) {
    if (!map) { return false }
    return key in map
}

function severTheArrow(nodes, node, arrow) {
    for (var prevId of node.prev) {
        var prev = nodes[prevId]
        if (prev.stack.includes(arrow.id)) {
            makeBreak(nodes, node, prev)
            prev.next = node.id
        }
    }
}

function mergeBranchingStack(nodes, node, branchingStack, filename) {
    // Append all elements of the branching stack to node.stack
    for (let i = 0; i < branchingStack.length; i++) {
        node.stack.push(branchingStack[i]);
    }

    // Build a dictionary of occurrences
    const dictionary = buildDictionaryOfOccurences(node);

    // Merge all nodes
    mergeAll(nodes, node, dictionary, filename);

    // Rebuild the stack
    node.stack = buildStackFromDictionary(dictionary);
}

function buildStackFromDictionary(dictionary) {
    const rebuiltStack = [];
    for (const id in dictionary) {
        if (dictionary[id] > 0) {
            rebuiltStack.push(id);
        }
    }
    return rebuiltStack;
}

function buildDictionaryOfOccurences(node) {
    const dictionary = {};
    for (let i = 0; i < node.stack.length; i++) {
        const id = node.stack[i];
        dictionary[id] = (dictionary[id] || 0) + 1;
    }
    return dictionary;
}

function mergeAll(nodes, node, dictionary, filename) {
    var oldStack = Object.keys(dictionary)
    for (const id in dictionary) {
        const occurrences = dictionary[id];
        const algonode = nodes[id];
        if (occurrences > 1) {            
            algonode.branching--;
            dictionary[id] = occurrences - 1;
        }

        if (algonode.branching === 1) {
            if (algonode.type === "question") {
                algonode.next = node.id;
                dictionary[algonode.id] = 0;    
                completeQuestion(nodes, node, algonode, dictionary, filename)
            } else if (algonode.type === "arrow-loop") {    
                if (!isInMap(node.astack, algonode.id)) {
                    algonode.next = node.id;
                    dictionary[algonode.id] = 0;                 
                    severTheArrow(nodes, node, algonode)
                }            
            }
        }
    }
}

function completeQuestion(nodes, node, algonode, dictionary, filename) {
    if (algonode.parentLoopId && node.parentLoopId !== algonode.parentLoopId) {
        markBreak(nodes, node, algonode, filename)                   
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
    if (node.next === from) {
        node.next = to
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


module.exports = { structFlow, prepareQuestions, handleBreaks, redirectNode };