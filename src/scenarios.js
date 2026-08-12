const {prepareDrakonDiagram} = require('./drakonToStruct');
var tr;
function addContent(step, depth, lines) {
    var _selectValue_2, content;
    if (step.secondary) {
        addLine(step.secondary, depth, lines);
    }
    _selectValue_2 = step.type;
    if (_selectValue_2 === 'question') {
        content = normalizeContent(step);
        if (step.answer === 'yes') {
            content = yesPath(content);
        } else {
            content = noPath(content);
        }
    } else {
        if (_selectValue_2 === 'loopbegin') {
            if (step.loop === 'iteration') {
                content = iteration(step.content);
            } else {
                content = skipLoop(step.content);
            }
        } else {
            content = step.content;
        }
    }
    addLine(content, depth, lines);
}
function addLine(text, depth, lines) {
    var indent, part, parts;
    indent = ' '.repeat(4 * depth);
    parts = text.split('\n');
    for (part of parts) {
        lines.push(indent + part);
    }
}
function branchContext(ctx) {
    return {
        nodes: ctx.nodes,
        firstNodeId: ctx.firstNodeId,
        scenarios: ctx.scenarios,
        decisions: ctx.decisions,
        branchCount: clone(ctx.branchCount)
    };
}
function buildContent(step) {
    var _selectValue_2, content;
    _selectValue_2 = step.type;
    if (_selectValue_2 === 'question') {
        content = normalizeContent(step);
        if (step.answer === 'yes') {
            return yesPath(content);
        } else {
            return noPath(content);
        }
    } else {
        if (_selectValue_2 === 'loopbegin') {
            if (step.loop === 'iteration') {
                return iteration(step.content);
            } else {
                return skipLoop(step.content);
            }
        } else {
            return step.content;
        }
    }
}
function clone(obj) {
    var copy;
    copy = {};
    Object.assign(copy, obj);
    return copy;
}
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
function cloneStep(step, scenario) {
    var clone;
    clone = {
        id: step.id,
        type: step.type,
        content: step.content
    };
    if (!(step.secondary === undefined)) {
        clone.secondary = step.secondary;
    }
    if (!(step.message === undefined)) {
        clone.message = step.message;
    }
    scenario.push(clone);
    return clone;
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
    if (step.flag1 == 1) {
        return {
            down: 'yes',
            right: 'no'
        };
    } else {
        return {
            down: 'no',
            right: 'yes'
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
function normalizeContent(step) {
    var content;
    content = step.content;
    if (content.operator === 'equal') {
        return content.left + ' == ' + content.right;
    } else {
        return content;
    }
}
function printParallel(step, baseIndex, depth, lines) {
    var _collection_2, branch, i;
    i = 1;
    _collection_2 = step.procs;
    for (branch of _collection_2) {
        addLine(tr('Parallel process') + ' ' + i, depth, lines);
        printScenariosCore(branch.scenarios, baseIndex + '.' + i, depth + 1, lines);
        i++;
    }
}
function printScenario(scenario, baseIndex, depth, lines) {
    var step;
    for (step of scenario) {
        if (step.type === 'parallel') {
            printParallel(step, baseIndex, depth, lines);
        } else {
            if (step.type === 'error') {
                addLine(step.message + ': ' + step.content, depth, lines);
            } else {
                addContent(step, depth, lines);
            }
        }
    }
}
function printScenarios(scenarios, name, translateFunction) {
    var baseIndex, depth, lines;
    tr = translateFunction;
    lines = [];
    lines.push('# ' + name + ': ' + tr('scenarios'));
    baseIndex = '';
    depth = 0;
    printScenariosCore(scenarios, baseIndex, depth, lines);
    return lines.join('\n');
}
function printScenariosCore(scenarios, baseIndex, depth, lines) {
    var i, scenario, subheader;
    if (baseIndex) {
        baseIndex = baseIndex + '.';
    }
    i = 1;
    for (scenario of scenarios) {
        subheader = tr('Scenario') + ' ' + baseIndex + i;
        addLine(subheader, depth, lines);
        printScenario(scenario, baseIndex + i, depth + 1, lines);
        i++;
    }
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
    var maxBranch;
    maxBranch = 2;
    if (!(nodeId in ctx.branchCount)) {
        ctx.branchCount[nodeId] = 0;
    }
    ctx.branchCount[nodeId]++;
    if (ctx.branchCount[nodeId] > maxBranch) {
        return true;
    } else {
        return false;
    }
}
function traverseNode(ctx, nodeId, scenario) {
    var _selectValue_2, ctx2, down, exits, iteration, right, scenarioRight, skip, step, visited;
    if (nodeId) {
        step = ctx.nodes[nodeId];
        visited = visit(ctx, step);
        _selectValue_2 = step.type;
        if (_selectValue_2 === 'question') {
            exits = getQuestionExits(step);
            if (visited) {
                down = cloneStep(step, scenario);
                down.answer = exits.down;
                traverseNode(ctx, step.one, scenario);
            } else {
                ctx2 = branchContext(ctx);
                scenarioRight = cloneScenario(ctx2, scenario);
                down = cloneStep(step, scenario);
                down.answer = exits.down;
                traverseNode(ctx, step.one, scenario);
                right = cloneStep(step, scenarioRight);
                right.answer = exits.right;
                traverseNode(ctx2, step.two, scenarioRight);
            }
        } else {
            if (_selectValue_2 === 'loopbegin') {
                if (visited) {
                    iteration = cloneStep(step, scenario);
                    iteration.loop = 'iteration';
                    traverseNode(ctx, step.one, scenario);
                } else {
                    ctx2 = branchContext(ctx);
                    scenarioRight = cloneScenario(ctx2, scenario);
                    iteration = cloneStep(step, scenario);
                    iteration.loop = 'iteration';
                    traverseNode(ctx, step.one, scenario);
                    skip = cloneStep(step, scenarioRight);
                    skip.loop = 'skip';
                    traverseNode(ctx2, step.next, scenarioRight);
                }
            } else {
                if (_selectValue_2 === 'branch') {
                    if (step.content) {
                        cloneStep(step, scenario);
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
                                cloneStep(step, scenario);
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
module.exports = {
    printScenarios,
    treeToScenarios
};