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

## Project mode

Drakongen in project mode generates a single prompt file by processing and concatenating multiple input files, including flowcharts, mind-maps, text files, and directories. It reads a project file specifying the input files, processes them in the defined order, and outputs a consolidated prompt file suitable for AI-driven code generation.

### Features

- **Processes multiple file types**:
  - Plain text files (e.g., `.txt`) are included as-is.
  - Mind-map files (e.g., `.graf`) are converted to indented text.
  - Flowchart files (e.g., `.drakon`) are converted to pseudocode.
  - Directories are recursively processed, including all files within.
- **Preserves file order**: Files are processed and concatenated in the exact order specified in the project file, which is critical for AI tools relying on sequential context.
- **Flexible project file format**: A simple text-based project file lists files and directories to process.


### Usage

Run the tool with the following command:

```bash
drakongen --project <project_file> --output <output_directory>
```

- `--project`: Path to the project file (e.g., `exampleproject/foo.proj`).
- `--output`: Directory where the output prompt file will be saved (e.g., `exampleproject`).

### Example

Given a project file `exampleproject/foo.proj` with the following content:


```
start.txt
math
class Point.graf
foo.drakon
```

Run:

```bash
drakongen --project exampleproject/foo.proj --output exampleproject
```

This will:

1. Include `start.txt` as-is.
2. Process all files in the `math` directory recursively.
3. Convert `class Point.graf` (mind-map) to indented text.
4. Convert `foo.drakon` (flowchart) to pseudocode.
5. Concatenate all processed content into `exampleproject/foo.txt`.

The output file `foo.txt` will contain the concatenated text in the exact order specified in `foo.proj`.

### Project File Format

The project file (e.g., `foo.proj`) is a plain text file where each line specifies:

- A file path (relative to the project file) for a text, mind-map, or flowchart file.
- A directory path to process all files within it recursively.

