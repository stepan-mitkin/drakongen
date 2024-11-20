const path = require('path');
const { parse } = require('node-html-parser');
const {drakonToStruct} = require("./drakonToStruct");
const { printPseudo } = require('./printPseudo');
var {addRange} = require("./tools")


var translations = {
    "error": "ОШИБКА",
    "not": "не",
    "and": "и",
    "or": "или",
    "if": "Если",
    "else": "Иначе",
    "empty": "ПУСТОЙ",
    "loop forever": "Бесконечный цикл",
    "pass": "Пропустить",
    "Only the rightmost Case icon can be empty": "Только самая правая икона Вариант может быть пустой",
    "Error parsing JSON": "Ошибка парсинга JSON",
    "A Loop begin icon must have content": "Икона начала цикла ДЛЯ должна содержать данные",
    "A Question icon must have content": "Икона Вопрос должна содержать данные",
    "A Select icon must have content": "Икона Выбор должна содержать данные",
    "Loop end expected here": "Здесь ожидается конец цикла",
    "An exit from the loop must lead to the point right after the loop end": "Выход из цикла должен вести в точку сразу за его концом",
    "A silhouette branch is not referenced": "Нет ссылок на ветку силуэта",
    "Call subroutine": "Вызвать подпрограмму",
    "Procedure": "Процедура",
    "End of procedure": "Конец процедуры",
    "Subroutine": "Подпрограмма",
    "End of subroutine": "Конец подпрограммы",
    "Description": "Описание",
    "Algorithm": "Алгоритм"
}

function translate(text) {
    return translations[text] || text;
}

function drakonToPromptStruct(drakonJson, name, filename, htmlToString) {

    var diagram = drakonToStruct(drakonJson, name, filename, translate)
    var lines = []
    lines.push(translate("Procedure") + " \"" + diagram.name + "\"")
    if (diagram.params) {
        lines.push("")
        lines.push(translate("Description") + ":")
        addRange(lines, htmlToString(diagram.params))
    }
    lines.push("")
    lines.push(translate("Algorithm") + ":")    
    var first = diagram.branches[0]
    if (diagram.branches.length === 1) {
        printPseudo(first, translate, lines, htmlToString)
    } else {
        lines.push(translate("Call subroutine") + ": \"" + htmlToString(first.name) + "\"")
        diagram.branches.forEach(branch => {
            lines.push("")
            lines.push(translate("Subroutine") + ": \"" + htmlToString(branch.name) + "\"")
            printPseudo(branch, translate, lines, htmlToString)
            lines.push(translate("End of subroutine"))
        })
    }
    lines.push(translate("End of procedure"))
    var text = lines.join("\n")
    
    var str = JSON.stringify(diagram, null, 4)
    return {text:text,json:str}
}


module.exports = { drakonToPromptStruct };