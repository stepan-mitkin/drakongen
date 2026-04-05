const { toTree, toPseudocode, toMindTree, freeToText } = require("./src/index");

const fs = require("fs").promises;
const path = require("path");

async function main() {
  var filename = "secondary/Secondary.drakon";
  var content = await fs.readFile(filename, "utf-8");
  var options = { secondary: "Bad" };
  var result = toTree(content, "Secondary", filename, "en", options);
  console.log(result);
}

main();
