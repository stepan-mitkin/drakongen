const {prepareDrakonDiagram} = require('./drakonToStruct');
var tr;
function cloneContext(ctx, firstNodeId, scenarios) {
    return {
        nodes: ctx.nodes,
        firstNodeId: firstNodeId,
        scenarios: scenarios,
        decisions: {},
        branchCount: {}
    };
}
function cloneScenario(ctx, scenario) {
    var clone;
    clone = scenario.slice();
    ctx.scenarios.push(clone);
    return clone;
}
function cloneStep(step, content, scenario) {
    var clone;
    clone = {
        id: step.id,
        type: step.type,
        content: content
    };
    if (!(step.secondary === undefined)) {
        clone.secondary = step.secondary;
    }
    scenario.push(clone);
}
function createContext(dinfo) {
    return {
        nodes: dinfo.nodes,
        firstNodeId: dinfo.firstNodeId,
        scenarios: [],
        decisions: {},
        branchCount: {}
    };
}
function createScenario(ctx) {
    var scenario;
    scenario = [];
    ctx.scenarios.push(scenario);
    return scenario;
}
function getQuestionExits(step) {
    var content;
    content = step.content;
    if (content.operator === 'equal') {
        content = content.left + ' == ' + content.right;
    }
    if (step.flag1 == 1) {
        return {
            contentDown: yesPath(content),
            contentRight: noPath(content)
        };
    } else {
        return {
            contentDown: noPath(content),
            contentRight: yesPath(content)
        };
    }
}
function handleParallel(ctx, step, scenario) {
    var _collection_2, clone, ctxClone, next, proc, proc2;
    next = step.procs[0].next;
    clone = {
        id: step.id,
        procs: [],
        type: 'parallel'
    };
    scenario.push(clone);
    _collection_2 = step.procs;
    for (proc of _collection_2) {
        proc2 = { scenarios: [] };
        clone.procs.push(proc2);
        ctxClone = cloneContext(ctx, proc.start, proc2.scenarios);
        scanAlgorithm(ctxClone);
    }
    traverseNode(ctx, next, scenario);
}
function iteration(content) {
    return tr('Iteration') + ': ' + content;
}
function noPath(content) {
    return content + ' - ' + tr('No');
}
function scanAlgorithm(ctx) {
    var scenario;
    scenario = createScenario(ctx);
    traverseNode(ctx, ctx.firstNodeId, scenario);
}
function skipLoop(content) {
    return tr('Skip loop') + ': ' + content;
}
function tooManyLoops(ctx, nodeId) {
    var count, maxBranch;
    maxBranch = 2;
    if (nodeId in ctx.branchCount) {
        count = ctx.branchCount[nodeId];
        if (count > maxBranch) {
            return true;
        } else {
            count++;
            ctx.branchCount[nodeId] = count;
            return false;
        }
    } else {
        ctx.branchCount[nodeId] = 1;
        return false;
    }
}
function traverseNode(ctx, nodeId, scenario) {
    var _selectValue_2, content, exits, scenarioRight, step, visited;
    if (nodeId) {
        step = ctx.nodes[nodeId];
        visited = visit(ctx, step);
        _selectValue_2 = step.type;
        if (_selectValue_2 === 'question') {
            exits = getQuestionExits(step);
            if (visited) {
                cloneStep(step, exits.contentDown, scenario);
                traverseNode(ctx, step.one, scenario);
            } else {
                scenarioRight = cloneScenario(ctx, scenario);
                cloneStep(step, exits.contentDown, scenario);
                traverseNode(ctx, step.one, scenario);
                cloneStep(step, exits.contentRight, scenarioRight);
                traverseNode(ctx, step.two, scenarioRight);
            }
        } else {
            if (_selectValue_2 === 'loopbegin') {
                content = iteration(step.content);
                if (visited) {
                    traverseNode(ctx, step.one, scenario);
                } else {
                    scenarioRight = cloneScenario(ctx, scenario);
                    cloneStep(step, content, scenario);
                    traverseNode(ctx, step.one, scenario);
                    cloneStep(step, skipLoop(step.content), scenarioRight);
                    traverseNode(ctx, step.next, scenarioRight);
                }
            } else {
                if (_selectValue_2 === 'branch') {
                    if (step.content) {
                        cloneStep(step, step.content, scenario);
                    }
                    if (!tooManyLoops(ctx, nodeId)) {
                        traverseNode(ctx, step.one, scenario);
                    }
                } else {
                    if (_selectValue_2 === 'parbegin') {
                        handleParallel(ctx, step, scenario);
                    } else {
                        if (!(_selectValue_2 === 'parend')) {
                            if (step.content) {
                                cloneStep(step, step.content, scenario);
                            }
                            if (!(step.type === 'error')) {
                                traverseNode(ctx, step.one, scenario);
                            }
                        }
                    }
                }
            }
        }
    }
}
function treeToScenarios(drakonJson, name, filename, translateFunction, htmlToString) {
    var ctx, dinfo, options;
    tr = translateFunction;
    options = { skipShortcuts: true };
    dinfo = prepareDrakonDiagram(drakonJson, name, filename, translateFunction, htmlToString, options);
    if (dinfo.firstNodeId) {
        ctx = createContext(dinfo);
        scanAlgorithm(ctx, dinfo);
        return ctx.scenarios;
    } else {
        return [];
    }
}
function visit(ctx, step) {
    if (step.id in ctx.decisions) {
        return true;
    } else {
        ctx.decisions[step.id] = true;
        return false;
    }
}
function yesPath(content) {
    return content + ' - ' + tr('Yes');
}
module.exports = { treeToScenarios };