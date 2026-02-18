
function optimizeTree(steps) {
    var result = []

    for (var step of steps) {
        if (step.type === "end" || step.type === "branch" || step.type === "loopend") { continue }
        if ((step.type === "action" || step.type === "comment") && !step.content) { continue }
        var copy
        if (step.type === "question") {
            copy = optimizeQuestion(step)
        } else if (step.type === "parbegin") {
            copy = optimizeParbegin(step)
        } else if (step.type === "loop") {
            copy = optimizeLoop(step)
        } else {
            copy = step
        }
        result.push(copy)
    }

    return result
}

function optimizeParbegin(step) {
    var procs = []
    for (var proc of step.procs) {
        var procCopy = {
            ordinal: proc.ordinal,
            body: optimizeTree(proc.body)
        }
        procs.push(procCopy)
    }
    return {
        id: step.id,
        type: step.type,
        procs: procs
    }
}

function optimizeLoop(step) {
    return {
        id: step.id,
        type: step.type,
        content: step.content,
        body: optimizeTree(step.body)
    }
}

function optimizeQuestion(step) {
    var yes = optimizeTree(step.yes)
    var no = optimizeTree(step.no)
    if (yes.length === 0 && no.length === 0) {
        return {
            side: step.side,
            type: step.type,
            content: step.content,
            yes: [],
            no: []
        }    
    }
    if (yes.length === 0) {
        return {
            side: step.side,
            type: step.type,
            content: {operator:"not",operand:step.content},
            yes: no,
            no: []
        }
    }
    return {
        side: step.side,
        type: step.type,
        content: step.content,
        yes: yes,
        no: no
    }    
}


module.exports = {optimizeTree}