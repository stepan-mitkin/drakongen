# drakongen

**drakongen** generates pseudocode from drakon flowcharts and mind-maps built with [DrakonWidget](https://github.com/stepan-mitkin/drakonwidget) or [DrakonHub](https://github.com/stepan-mitkin/drakonhub_desktop).

One can use the output pseudocode as a prompt for AI applications like ChatGPT, Grok, or Gemini.

**drakongen** can also generate a generic AST from drakon flowcharts to generate source code in programming languages, for example, JavaScript.
**drakongen**  turns a drakon flowchart into a tree in the JSON format that one can trivially transform into code in any programming language.

## How to use drakongen in the browser

Include the `drakongen.js` script on the web page.

```html
<script src="browser/drakongen.js"></script>
```

Call `drakongen.toPseudocode`, `drakongen.toMindTree`, or `drakongen.toTree` functions.

```html
<script>
var drakon = ... // Get the drakon chart from DrakonWidget
var mindJson = ... // Graf mind-map as json
var name = "Diagram one"
var filename = "Diagram one.drakon"

var pseudo = drakongen.toPseudocode(drakon, name, filename, "en")
console.log(pseudo)

var mind = drakongen.toMindTree(mindJson, name, filename)
console.log(mind)

var tree = drakongen.toTree(drakon, name, filename, "en")
console.log(tree)

</script>
```

Available languages:

- en English
- no Norwegian
- ru Russian

## How to use drakongen in Node JS

Add the **drakongen** package to dependencies.

```
npm i drakongen
```

- Require the **drakongen** module.
- Call `toPseudocode`, `toMindTree`, or `toTree` functions.

```javascript
const {toTree, toPseudocode} = require("drakongen")

var drakon = ... // Get the drakon chart from DrakonWidget
var mindJson = ... // Graf mind-map as json
var name = "Diagram one"
var filename = "Diagram one.drakon"

var pseudo = toPseudocode(drakon, name, filename, "en")
console.log(pseudo)

var mind = toMindTree(mindJson, name, filename)
console.log(mind)

var tree = toTree(drakon, name, filename, "en")
console.log(tree)
```

## How to use drakongen as a command-line tool

Install **drakongen** globally.

```
npm i --global drakongen
```

Run the **drakongen** utility.

### Generate from one file

A .drakon flowchart will be converted to pseudocode.

A .graf mind-map will be converted to tree-like text.

In this example, the language is Norwegian, the path to the output folder is **out**, the input file is **Hello.drakon**:

```
drakongen --language no --output out Hello.drakon
```

### Generate from a folder

Convert and concatenate all files in a folder.

Read all .drakon and .graf files in the specified input folder, generate pseudocode for each file, and write the output prompt to one text file in the output folder.

.drakon flowcharts will be converted to pseudocode.

.graf mind-maps will be converted to tree-like text.

.txt files will be included in the output file as they are.


In this example, the path to the output folder is **out**, the input folder is **examples**:

```
drakongen --output out examples
```
