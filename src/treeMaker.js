function treeMaker(nodes, nodeId, body, stopId) {
    while (nodeId) {
        // Stop processing if the node ID matches the stopping condition
        if (nodeId === stopId) return;

        const node = nodes[nodeId];
        if (!node) {
            throw new Error(`Node with ID ${nodeId} does not exist in the graph.`);
        }

        let transformed;
        let next;

        if (node.type === "question") {
            // Get the next target node and manage the targetTaken property
            const target = nodes[node.next];
            if (target?.targetTaken) {
                next = undefined;
            } else {
                next = node.next;
                target.targetTaken = true; // Mark the target node as taken
            }

            // Transform the question node
            transformed = {
                id: node.id,
                type: "question",
                content: node.content || "",
                yes: [],
                no: []
            };

            // Determine the yes and no branches based on the flag1 property
            const yesNodeId = node.flag1 === 1 ? node.one : node.two;
            const noNodeId = node.flag1 === 1 ? node.two : node.one;

            // Recursively process the branches
            treeMaker(nodes, yesNodeId, transformed.yes, node.next);
            treeMaker(nodes, noNodeId, transformed.no, node.next);
        } else {
            // Transform a normal node
            transformed = {
                id: node.id,
                type: node.type,
                content: node.content || "",
                message: node.message || "",
                secondary: node.secondary || ""
            };
            next = node.one; // Continue to the next node
        }

        // Add the transformed node to the output array
        body.push(transformed);

        // Move to the next node
        nodeId = next;
    }
}

module.exports = {treeMaker}
