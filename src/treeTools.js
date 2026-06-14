
function optimizeTree(steps) {
    var result = []

    for (var step of steps) {
        if (step.type === "end" || step.type === "branch" || step.type === "loopend") { continue }
        if ((step.type === "action" || step.type === "comment") && !step.content) { continue }
        if (step.type === "question") {
            optimizeQuestion(step, result)
        } else if (step.type === "parbegin") {
            optimizeParbegin(step, result)
        } else if (step.type === "loop" || step.type === "loopbegin") {
            optimizeLoop(step, result)
        } else {
            result.push(step)
        }
    }

    return result
}

function optimizeParbegin(step, output) {
    var procs = []
    for (var proc of step.procs) {
        var procCopy = {
            ordinal: proc.ordinal,
            body: optimizeTree(proc.body)
        }
        procs.push(procCopy)
    }
    output.push({
        id: step.id,
        type: step.type,
        procs: procs
    })
}

function optimizeLoop(step, output) {
    output.push({
        id: step.id,
        type: "loop",
        content: step.content,
        body: optimizeTree(step.body)
    })
}

function endsWithBreak(body) {
    if (body.length === 0) {
        return false
    }
    var lastId = body.length - 1
    return body[lastId].type === "break"
}

function optimizeQuestion(step, output) {
    var yes = optimizeTree(step.yes)
    var no = optimizeTree(step.no)
    var breakYes = endsWithBreak(yes)
    var breakNo = endsWithBreak(no)

    var result = {
        id: step.id,
        side: step.side,
        type: step.type
    }
    if (breakYes && breakNo) {
        yes.pop()
        no.pop()
    }    
    if (yes.length === 0 && no.length === 0) {
        result.content = step.content
        result.yes = []
        result.no = []
    } else if (yes.length === 0) {
        result.content = {operator:"not",operand:step.content}
        result.yes = no
        result.no = []
    } else {
        result.content = step.content,
        result.yes = yes,
        result.no = no
    }
    output.push(result)
    if (breakYes && breakNo) {
        output.push({type: "break"})
    }
}


module.exports = {optimizeTree}