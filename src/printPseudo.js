const { parse } = require('node-html-parser');

function printPseudo(algorithm, translations, output) {

    // Helper to translate strings
    function translate(text) {
        return translations[text] || text;
    }

    // Helper function to convert HTML to plain text
    function htmlToString(html) {
        if (!html) return '';
        if (!html.startsWith('<') || !html.endsWith('>')) {
            return html.split("\n").map(line => {return line.trim()})
        }

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

        return output;
    }

    function addRange(to, from) {
        for (var item of from) {
            to.push(item)
        }
    }

    function printStructuredContent(content, indent, output) {
        var lines = printStructuredContentNoIdent(content)
        printWithIndent(lines, indent, output)
    }

    function printWithIndent(lines, indent, output) {
        lines.forEach(line => output.push(indent + line))
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

    function makeIndent(depth) {
        return " ".repeat(depth * 4); 
    }

    function printSteps(steps, depth, output) {
        const indent = makeIndent(depth)
        for (var step of steps) {
            if (step.type === "end" || step.type === "branch" || step.type === "comment") { continue }
            if (step.type === "question") {
                printQuestion(step, depth, output)
            } else if (step.type === "loop") {
                printLoop(step, depth, output)                     
            } else if (step.type === "error") {
                printError(step, indent, output)
            } else if (step.type === "break") {
                output.push(indent + translate("break"))
            } else {
                printOther(step, indent, output)
            }
        }
    }
    
    function printOther(step, indent, output) {
        if (!step.content && !step.secondary) {return}
        if (step.secondary) {            
            printStructuredContent(step.secondary, indent, output)
        }
        if (step.content) {
            printStructuredContent(step.content, indent, output)
        }        
        output.push("")
    }

    function printError(step, indent, output) {
        output.push(indent + translate("Error") + ":")
        output.push(indent + step.message)
        if (step.content) {
            printStructuredContent(step.content, indent, output)
        }        
        output.push("")
    }    

    function empty(array) {
        return array.length === 0
    }

    function printQuestion(step, depth, output) {
        const indent = makeIndent(depth)
        var yesBody = []
        printSteps(step.yes, depth + 1, yesBody)
        var noBody = []
        printSteps(step.no, depth + 1, noBody)        
        if (empty(yesBody) && empty(noBody)) {
            yesBody.push(indent + translate("pass"))
        }
        var content = step.content
        if (empty(yesBody)) {
            content = {operator:"not",operand:step.content}
        }
        var lines = printStructuredContentNoIdent(content)
        lines[0] = translate("If") + " " + lines[0]
        printWithIndent(lines, indent, output)
        if (empty(yesBody)) {
            addRange(output, noBody)           
        } else {
            addRange(output, yesBody)            
            if (!empty(noBody)) {
                output.push(indent + translate("Else"))
                addRange(output, noBody)
            }
        }    
    }      

    function printLoop(step, depth, output) {
        const indent = makeIndent(depth)
        var body = []
        printSteps(step.body, depth + 1, body)
        if (empty(body)) {
            body.push(indent + translate("pass"))
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

module.exports = {printPseudo}