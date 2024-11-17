const path = require('path');
const { parse } = require('node-html-parser');

// Helper function to convert HTML to plain text
function htmlToString(html) {
    if (!html) return '';
    if (!html.startsWith('<') || !html.endsWith('>')) return html;

    const root = parse(html);
    const output = [];

    root.childNodes.forEach((node) => {
        if (node.tagName === 'P') {
            output.push(node.text.trim());
        } else if (node.tagName === 'UL') {
            output.push('');
            node.childNodes.forEach((item) => {
                if (item.tagName === 'LI') {
                    output.push(`- ${item.text.trim()}`);
                }
            });
            output.push('');
        } else if (node.tagName === 'OL') {
            output.push('');
            node.childNodes.forEach((item, index) => {
                if (item.tagName === 'LI') {
                    output.push(`${index + 1}. ${item.text.trim()}`);
                }
            });
            output.push('');
        }
    });

    return output.join('\n');
}

// Main function
function drakonToPrompt(drakonJson, filename) {
    let drakonGraph;
    try {
        drakonGraph = JSON.parse(drakonJson);
    } catch (error) {
        throw new Error(`Error parsing JSON in file "${filename}": ${error.message}`);
    }

    const output = [];
    const baseFilename = path.parse(filename).name;

    output.push(`Procedure "${baseFilename}"`);
    output.push('');

    if (drakonGraph.params) {
        output.push('Description:');
        output.push(htmlToString(drakonGraph.params));
        output.push('');
    }

    const nodes = drakonGraph.items;
    preprocessInsertionNodes(nodes);
    preprocessSelectNodes(nodes);

    const visitedNodes = new Set();
    const workNodes = [];
    const firstNodeId = Object.keys(nodes).find(id =>
        nodes[id].type === 'branch' &&
        nodes[id].branchId === Math.min(...Object.values(nodes)
            .filter(n => n.type === 'branch').map(n => n.branchId))
    );

    if (!firstNodeId) {
        throw new Error(`No branch node found in the drakon-graph of file "${filename}".`);
    }

    processBranch(nodes, firstNodeId, visitedNodes, workNodes, filename);

    output.push('The algorithm of the procedure is expressed as a graph of steps.');
    if (workNodes.length > 0) {
        output.push(`The id of the first step is ${workNodes[0].id}`);
    }
    output.push('');

    workNodes.forEach(node => printNode(node, output, filename));

    output.push('End of procedure.');
    return output.join('\n');
}

// Preprocess insertion nodes by converting them to action nodes
function preprocessInsertionNodes(nodes) {
    for (const id in nodes) {
        const node = nodes[id];
        if (node.type === 'insertion') {
            node.type = 'action';
        }
    }
}

// Preprocess select nodes to build their cases
function preprocessSelectNodes(nodes) {
    for (const id in nodes) {
        const node = nodes[id];
        if (node.type === 'select') {
            node.cases = [];
            visitSelect(nodes, node.one, node.cases);
        }
    }
}

// Build cases for "select" nodes
function visitSelect(nodes, nodeId, cases) {
    if (!nodeId) return;
    const node = nodes[nodeId];
    cases.push({ value: node.content, next: node.one });
    visitSelect(nodes, node.two, cases);
}

// Traverse and collect work nodes
function processBranch(nodes, currentNodeId, visitedNodes, workNodes, filename) {
    while (currentNodeId) {
        const node = nodes[currentNodeId];

        if (visitedNodes.has(currentNodeId)) return;
        visitedNodes.add(currentNodeId);

        node.id = currentNodeId;

        switch (node.type) {
            case 'branch':
                currentNodeId = node.one;
                break;
            case 'end':
                return;
            case 'comment':
                currentNodeId = node.one;
                break;
            case 'action':
                if (node.content) {
                    workNodes.push(node);
                }
                currentNodeId = node.one;
                break;
            case 'question':
                if (!node.content) {
                    throw new Error(`A Question icon must have content in file "${filename}", node ${currentNodeId}.`);
                }
                workNodes.push(node);

                const yesNodeId = node.flag1 === 1 ? node.one : node.two;
                const noNodeId = node.flag1 === 1 ? node.two : node.one;

                processBranch(nodes, yesNodeId, visitedNodes, workNodes, filename);
                processBranch(nodes, noNodeId, visitedNodes, workNodes, filename);

                return;
            case 'select':
                if (!node.content) {
                    throw new Error(`A Select icon must have content in file "${filename}", node ${currentNodeId}.`);
                }
                workNodes.push(node);

                for (const item of node.cases) {
                    processBranch(nodes, item.next, visitedNodes, workNodes, filename);
                }
                return;
            case 'arrow-loop':
                workNodes.push(node);
                currentNodeId = node.one;
                break;
            default:
                throw new Error(`Unsupported node type "${node.type}" in file "${filename}", node ${currentNodeId}.`);
        }
    }
}

// Print node details to the output list
function printNode(node, output, filename) {
    if (node.type === 'action') {
        if (node.content) {
            output.push(`Step id: ${node.id}`);
            output.push(htmlToString(node.content));
            output.push(`Next step: ${node.one}`);
            output.push('End of step.');
            output.push('');
        }
    } else if (node.type === 'question') {
        output.push(`Step id: ${node.id}`);
        output.push(htmlToString(node.content));

        const yesNodeId = node.flag1 === 1 ? node.one : node.two;
        const noNodeId = node.flag1 === 1 ? node.two : node.one;

        output.push(`If yes, next step: ${yesNodeId}`);
        output.push(`If no, next step: ${noNodeId}`);
        output.push('End of step.');
        output.push('');
    } else if (node.type === 'select') {
        output.push(`Step id: ${node.id}`);
        node.cases.forEach((item, index) => {
            if (item.value) {
                const leftValue = htmlToString(node.content);
                const rightValue = htmlToString(item.value);
                output.push(`If ${leftValue} = ${rightValue}, next step: ${item.next}`);
            } else if (index === node.cases.length - 1) {
                output.push(`Else, next step: ${item.next}`);
            } else {
                throw new Error(`Only the last Case icon can be empty in file "${filename}", node ${node.id}.`);
            }
        });
        output.push('End of step.');
        output.push('');
    } else if (node.type === 'arrow-loop') {
        output.push(`Step id: ${node.id}`);
        output.push(`Next step: ${node.one}`);
        output.push('End of step.');
        output.push('');
    }
}

module.exports = { drakonToPrompt };