function structFlow(nodes, nodeId, branchingStack) {
    // Step 1: Check for end
    if (!nodeId) return;

    const node = nodes[nodeId];

    // Step 2: Detect cycles
    if (branchingStack.includes(nodeId)) {
        return; // Loop detected
    }

    // Step 3: Can we continue?
    if (node.prev && node.prev.length > 1) {
        if (!node.stack) {
            node.stack = [];
            node.remaining = node.prev.length;
        }
        node.remaining--;
        mergeBranchingStack(nodes, node, branchingStack);
        if (node.remaining > 0) return;
    } else {
        node.stack = branchingStack.slice(); // Shallow copy of branching stack
    }

    // Step 4: Proceed
    if (node.type === "question") {
        for (let i = 0; i < node.stack.length; i++) {
            const questionId = node.stack[i];
            const question = nodes[questionId];
            question.branching++;
        }

        const firstCopy = node.stack.slice();
        const secondCopy = node.stack.slice();
        firstCopy.push(nodeId);
        secondCopy.push(nodeId);

        structFlow(nodes, node.one, firstCopy);
        structFlow(nodes, node.two, secondCopy);
    } else {
        structFlow(nodes, node.one, node.stack);
    }
}

function mergeBranchingStack(nodes, node, branchingStack) {
    // Append all elements of the branching stack to node.stack
    for (let i = 0; i < branchingStack.length; i++) {
        node.stack.push(branchingStack[i]);
    }

    // Build a dictionary to count occurrences of each ID in node.stack
    const dictionary = {};
    for (let i = 0; i < node.stack.length; i++) {
        const id = node.stack[i];
        dictionary[id] = (dictionary[id] || 0) + 1;
    }

    // Merge all elements in the stack using the dictionary
    mergeAll(nodes, node, dictionary);

    // Rebuild node.stack from the dictionary
    const newStack = [];
    for (const id in dictionary) {
        const count = dictionary[id];
        for (let i = 0; i < count; i++) {
            newStack.push(id);
        }
    }
    node.stack = newStack;
}

function mergeAll(nodes, node, dictionary) {
    for (const id in dictionary) {
        let occurrences = dictionary[id];
        if (occurrences > 1) {
            const question = nodes[id];
            question.branching--;
            if (question.branching === 1) {
                dictionary[id] = 0;
                question.next = node.id;
            } else {
                dictionary[id] = occurrences - 1;
            }
        }
    }
}

function prepareQuestions(nodes) {
    for (const nodeId in nodes) {
        const node = nodes[nodeId];
        if (node.type === "question") {
            node.branching = 2; // Initialize branching for "question" nodes
        }
    }
}

// Export functions in CommonJS format
module.exports = {
    structFlow,
    prepareQuestions,
};
