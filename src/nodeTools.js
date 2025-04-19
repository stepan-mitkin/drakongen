const { parse } = require('node-html-parser');


function htmlToString(html) {
    if (!html) return '';
    if (!html.startsWith('<') || !html.endsWith('>')) {
        return html.split("\n")
    }

    const root = parse(html);
    const output = [];

    root.childNodes.forEach((node) => {
        if (node.tagName === 'P') {
            output.push(node.text.trim());
        } else if (node.tagName === 'UL') {
            node.childNodes.forEach((item) => {
                if (item.tagName === 'LI') {
                    output.push(`- ${item.text.trim()}`);
                }
            });
        } else if (node.tagName === 'OL') {
            node.childNodes.forEach((item, index) => {
                if (item.tagName === 'LI') {
                    output.push(`${index + 1}. ${item.text.trim()}`);
                }
            });
        }
    });

    return output;
}

module.exports = {htmlToString}