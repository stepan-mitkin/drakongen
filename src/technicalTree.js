function buildTree(nodes, nodeId, body, stopId, afterLoop, onError) {
    while (nodeId) {
        if (nodeId === afterLoop) {
            body.push({type: "break"}) 
            return
        }
        if (nodeId === stopId) {
            return;
        }
        const node = nodes[nodeId];
        let transformed;
        let next;

        if (node.type === "question") {
            next = reserveNext(nodes, node)
            
            transformed = {
                id: node.id,
                type: "question",
                content: node.content || "",
                yes: [],
                no: []
            };

            const yesNodeId = node.flag1 === 1 ? node.one : node.two;
            const noNodeId = node.flag1 === 1 ? node.two : node.one;

            buildTree(nodes, yesNodeId, transformed.yes, node.next, afterLoop, onError);
            buildTree(nodes, noNodeId, transformed.no, node.next, afterLoop, onError);
            if (next === afterLoop) {
                next = undefined
            }
        } else if (node.type == "loopbegin") {
            transformed = {
                id: node.id,
                type: "loopbegin",
                content: node.content,
                end: node.end,
                body: []
            };
            var end = nodes[node.end]
            buildTree(nodes, node.one, transformed.body, node.end, end.one, onError)
            next = node.next;   
        } else if (node.type == "loopend") {
            if (stopId !== afterLoop) {
                onError(
                    "An exit from the loop must lead to the point right after the loop end",
                    node.id
                )
            }
            return            
        } else if (node.type === "arrow-loop") {
            transformed = {
                id: node.id,
                type: "loopbegin",
                content: "",
                end: node.stub,
                body: []
            };
            var end = nodes[node.stub]
            buildTree(nodes, node.one, transformed.body, node.stub, end.one, onError)
            next = node.next;  
        } else if (node.type === "arrow-stub") {
            return
        } else if (node.type === "parbegin") {
            transformed = {
                id: node.id,
                type: node.type,
                procs: []
            }            
            for (var proc of node.procs) {
                var childProc = {
                    ordinal: proc.ordinal,
                    body: []
                }
                transformed.procs.push(childProc)
                buildTree(nodes, proc.start, childProc.body, undefined, undefined, buildTree)
            }
            next = node.one;
        } else {
            transformed = {
                id: node.id,
                type: node.type,
            }
            copyFields(
                transformed,
                node,
                [
                    "content",
                    "secondary",
                    "start",
                    "message",
                    "end"
                ]
            )
            next = node.one;
            if (node.final) {
                next = undefined
            }
        }
        if (node.side) {
            transformed.side = node.side
        }
        body.push(transformed);
        nodeId = next;
    }
}

function copyFields(dst, src, fields) {
    for (var field of fields) {
        var value = src[field]
        if (value !== "" && value !== undefined && value !== null) {
            dst[field] = value
        }
    }
}

function reserveNext(nodes, node) {
    if (!node.next) {
        return undefined
    }
    const target = nodes[node.next];
    if (target.targetTaken) {
        return undefined;
    } else {
        target.targetTaken = true;
        return node.next;
    }    
}

module.exports = {buildTree}
