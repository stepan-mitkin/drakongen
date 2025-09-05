var {addRange} = require("./tools")

function makeIndent(depth) {
    return " ".repeat(depth * 4); 
}

function printWithIndent(lines, indent, output) {
    if (!lines) {return}
    lines.forEach(line => output.push(indent + line))
}

function printPseudo(algorithm, translate, output, htmlToString) {
    function printStructuredContent(content, indent, output, side) {
        var lines = printStructuredContentNoIdent(content)
        if (side) {
            lines[0] = side + ": " + lines[0]
        }
        printWithIndent(lines, indent, output)
    }

    function printStructuredContentNoIdent(content) {
        var lines = []

        if (typeof content === "string") {
            return htmlToString(content);
        } else if (content.operator === "not") {
            lines = printStructuredContentNoIdent(content.operand)
            if (lines.length > 0) {
                lines[0] = translate("not") + " (" + lines[0] + ")"
            }
        } else if (content.operator === "and" || content.operator === "or") {
            var operator = translate(content.operator)
            printBinary(content, operator, lines)
        } else if (content.operator === "equal") {
            var operator = "=="
            printBinary(content, operator, lines)
        }

        return lines;
    }

    function printBinary(content, operator, lines) {
        const leftLines = printOperand(content.left);
        const rightLines = printOperand(content.right);
        if (leftLines.length === 1 && rightLines.length === 1) {
            lines.push(leftLines[0] + " " + operator + " " + rightLines[0])
        } else {
            addRange(lines, leftLines)
            lines.push(operator);
            addRange(lines, rightLines)
        }
    }

    function printOperand(content) {
        var lines = printStructuredContentNoIdent(content)
        if (typeof content === "string" || content.operator === "not") {
            return lines
        }
        if (lines.length > 0) {
            lines[0] = "(" + lines[0]
            last = lines.length - 1
            lines[last] = lines[last] + ")"
        }
        return lines
    }

    function printSteps(steps, depth, output) {
        const indent = makeIndent(depth)
        for (var step of steps) {
            if (step.type === "end" || step.type === "branch") { continue }
            if (step.type === "question") {
                printQuestion(step, depth, output)
            } else if (step.type === "loop") {
                printLoop(step, depth, output)    
            } else if (step.type === "address") {
                printAddress(step, indent, output)                                      
            } else if (step.type === "error") {
                printError(step, indent, output)
            } else if (step.type === "break") {
                output.push(indent + translate("break"))
            } else if (step.type === "parbegin") {
                printParbegin(step, depth, output)
            } else {
                printOther(step, indent, output)
            }
        }
    }

    function printParbegin(step, depth, output) {
        const indent2 = makeIndent(depth + 1)
        const indent = makeIndent(depth)
        printWithIndent([translate("Group of parallel processes")], indent, output)
        for (var proc of step.procs) {
            printWithIndent([translate("Parallel process") + " " + (proc.ordinal + 1)], indent2, output)
            printSteps(proc.body, depth + 2, output)
        }
    }
    
    function printOther(step, indent, output) {
        var side = step.side
        if (!step.content && !step.secondary) {return}
        if (step.secondary) {            
            printStructuredContent(step.secondary, indent, output, side)
            side = undefined
        }
        if (step.content) {
            var content = step.content
            if (step.type === "pause") {
                content = translate("Pause") + " " + htmlToString(content).join(" ")
            } else if (step.type === "timer") {
                content = translate("Start timer") + " " + htmlToString(content).join(" ")
            }
            printStructuredContent(content, indent, output, side)
        }
    }

    function printAddress(step, indent, output) {
        var label
        if (step.content) {
            label = htmlToString(step.content);
        } else {
            label = translate("Subroutine") + " " + step.branch 
        }
        output.push(indent + translate("Call subroutine") + " \"" + label + "\"")
    }

    function printError(step, indent, output) {
        output.push(indent + translate("error") + ":")
        var ind2 = indent + makeIndent(1)
        output.push(ind2 + step.message)
        if (step.content) {
            var ind3 = indent + makeIndent(2)
            printStructuredContent(step.content, ind3, output)
        }        
    }    

    function empty(array) {
        return array.length === 0
    }

    function printQuestion(step, depth, output) {
        const indent = makeIndent(depth)
        const indent2 = makeIndent(depth + 1)
        var yesBody = []
        printSteps(step.yes, depth + 1, yesBody)
        var noBody = []
        printSteps(step.no, depth + 1, noBody)        
        if (empty(yesBody) && empty(noBody)) {
            yesBody.push(indent2 + translate("pass"))
        }
        var content = step.content
        var lines = printStructuredContentNoIdent(content)
        lines[0] = translate("if") + " " + lines[0]
        if (step.side) {
            lines[0] = step.side + ": " + lines[0]
        }
        printWithIndent(lines, indent, output)
        addRange(output, yesBody)            
        if (!empty(noBody)) {
            output.push(indent + translate("else"))
            addRange(output, noBody)
        }
    }      

    function printLoop(step, depth, output) {
        const indent2 = makeIndent(depth + 1)
        const indent = makeIndent(depth)
        var body = []
        printSteps(step.body, depth + 1, body)
        if (empty(body)) {
            body.push(indent2 + translate("pass"))
        }
        var content = step.content
        if (!content) {
            content = translate("loop forever")
        }
        printStructuredContent(content, indent, output)
        addRange(output, body)
    }      

    printSteps(algorithm.body, 0, output)
}

module.exports = {printPseudo, printWithIndent, makeIndent}