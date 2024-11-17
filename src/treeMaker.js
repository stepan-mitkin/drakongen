function treeMaker(nodes, nodeId, body, stopId) {
    while (nodeId) {
        // Step 1: Check if we reached the stop condition
        if (nodeId === stopId) return;

        const node = nodes[nodeId];
        if (!node) {
            throw new Error(`Node with ID ${nodeId} does not exist.`);
        }

        let transformed;
        let next;

        // Step 2: Process question nodes
        if (node.type === "question") {
            const target = nodes[node.next];
            if (target.targetTaken) {
                next = undefined;
            } else {
                next = node.next;
                target.targetTaken = true;
            }

            transformed = {
                id: node.id,
                type: "question",
                content: node.content || "",
                yes: [],
                no: []
            };

            const yesNodeId = node.flag1 === 1 ? node.one : node.two;
            const noNodeId = node.flag1 === 1 ? node.two : node.one;

            // Recursive calls for yes and no branches
            treeMaker(nodes, yesNodeId, transformed.yes, node.next);
            treeMaker(nodes, noNodeId, transformed.no, node.next);
        }
        // Step 3: Process loop nodes
        else if (node.type === "loopbegin") {
            transformed = {
                id: node.id,
                type: "loop",
                content: node.content || "",
                body: []
            };

            next = node.next;

            // Recursive call for the loop body
            treeMaker(nodes, node.one, transformed.body, node.end);
        }
        else if (node.type === "loopend") {
            return
        }        
        // Step 4: Process other nodes
        else {
            transformed = {
                id: node.id,
                type: node.type,
                content: node.content || "",
                message: node.message || "",
                secondary: node.secondary || ""
            };

            next = node.one; // Continue to the next node
        }

        // Step 5: Add transformed node to the tree
        body.push(transformed);

        // Move to the next node
        nodeId = next;
    }
}

module.exports = {treeMaker}
