var tr;
function cloneScenario(ctx, scenario) {
    var clone;
    clone = scenario.slice();
    ctx.scenarios.push(clone);
    return clone;
}
function createContext() {
    return {
        scenarios: [],
        branches: {},
        firstBranch: '',
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
function getBranchName(branch) {
    if (!branch.name) {
        branch.name = 'branch-' + branch.branchId;
    }
    return branch.name;
}
function indexBranchesByName(ctx, branches) {
    var branch, name;
    for (branch of branches) {
        name = getBranchName(branch);
        if (!ctx.firstBranch) {
            ctx.firstBranch = name;
        }
        ctx.branches[name] = branch;
    }
}
function noPath(content) {
    return content + ' - ' + tr('No');
}
function scanBody(ctx, body, start, scenario) {
    var _selectValue_2, clone, cloneNo, cloneYes, i, noScenario, step;
    for (i = start; i < body.length; i++) {
        step = body[i];
        _selectValue_2 = step.type;
        if (_selectValue_2 === 'question') {
            if (step.id in ctx.decisions) {
                clone = {
                    id: step.id,
                    type: step.type,
                    content: yesPath(step.content)
                };
                scanBody(ctx, step.yes, 0, scenario);
            } else {
                ctx.decisions[step.id] = true;
                noScenario = cloneScenario(ctx, scenario);
                cloneYes = {
                    id: step.id,
                    type: step.type,
                    content: yesPath(step.content)
                };
                scenario.push(cloneYes);
                scanBody(ctx, step.yes, 0, scenario);
                cloneNo = {
                    id: step.id,
                    type: step.type,
                    content: noPath(step.content)
                };
                noScenario.push(cloneNo);
                scanBody(ctx, step.no, 0, noScenario);
                scanBody(ctx, body, i + 1, noScenario);
            }
        } else {
            clone = {
                id: step.id,
                type: step.type,
                content: step.content
            };
            if (!(step.secondary === undefined)) {
                clone.secondary = step.secondary;
            }
            scenario.push(clone);
        }
    }
}
function scanBranches(ctx) {
    var first, scenario;
    first = ctx.branches[ctx.firstBranch];
    scenario = createScenario(ctx);
    scanBody(ctx, first.body, 0, scenario);
}
function treeToScenarios(tree, translate, filename) {
    var ctx;
    tr = translate;
    ctx = createContext();
    indexBranchesByName(ctx, tree.branches);
    scanBranches(ctx);
    return ctx.scenarios;
}
function yesPath(content) {
    return content + ' - ' + tr('Yes');
}
module.exports = { treeToScenarios };