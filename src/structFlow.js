var { buildTree } = require("./technicalTree");
const { createError, sortByProperty } = require("./tools");
const { optimizeTree } = require("./treeTools");
const { flow_no_loop } = require("./noloop")

function redirectNode(nodes, node, from, to) {
  if (node.one === from) {
    node.one = to;
  }
  if (node.two === from) {
    node.two = to;
  }
  if (node.next === from) {
    node.next = to;
  }
  if (node.start && node.type === "loopend") {
    start = nodes[node.start];
    if (start.next === from) {
      start.next = to;
    }
  }
}

function structFlow(nodes, branches, filename, translate, options) {

  function prepareQuestions(nodes) {
    for (const nodeId in nodes) {
      const node = nodes[nodeId];
      if (node.type === "question") {
        node.branching = 2;
      } else if (node.type === "arrow-loop") {
        node.branching = 1;
      }
    }
  }

  function rewireArrows(nodes, branches) {
    branches.forEach((branch) =>
      rewireArrowsInBranch(nodes, branch.id, branch.next, []),
    );
    for (var id in nodes) {
      var node = nodes[id];
      if (node.type === "arrow-loop") {
        var stub = insertArrowStub(nodes, node);
        var visited = {};
        fillAStack(nodes, stub, stub.arrow, visited);
      }
    }
  }

  function fillAStack(nodes, node, arrowId, visited) {
    if (node.id in visited) {
      return;
    }
    visited[node.id] = true;
    if (!node.astack) {
      node.astack = {};
    }
    node.astack[arrowId] = true;
    if (node.id === arrowId) {
      return;
    }
    for (var prevId of node.prev) {
      var prev = nodes[prevId];
      fillAStack(nodes, prev, arrowId, visited);
    }
  }

  function rewireArrowsInBranch(nodes, prevNodeId, nodeId, arrowStack) {
    if (!nodeId) {
      return;
    }
    var node = nodes[nodeId];
    if (node.type === "branch") {
      return;
    }
    if (node.type === "arrow-loop") {
      if (!node.noloop) {
        node.noloop = {};
      }
      if (arrowStack.includes(nodeId)) {
        return;
      }
      node.noloop[prevNodeId] = true;
      arrowStack = arrowStack.slice();
      arrowStack.push(nodeId);
      rewireArrowsInBranch(nodes, nodeId, node.one, arrowStack);
    } else if (node.type === "question") {
      var left = arrowStack.slice();
      var right = arrowStack.slice();
      rewireArrowsInBranch(nodes, nodeId, node.one, left);
      rewireArrowsInBranch(nodes, nodeId, node.two, right);
    } else if (node.type === "parbegin") {
      for (var proc of node.procs) {
        rewireArrowsInBranch(nodes, undefined, proc.start, []);
      }
      rewireArrowsInBranch(nodes, nodeId, node.one, arrowStack);
    } else {
      rewireArrowsInBranch(nodes, nodeId, node.one, arrowStack);
    }
  }

  function insertArrowStub(nodes, node) {
    var stub = {
      type: "arrow-stub",
      id: "arrow-stub-" + node.id,
      arrow: node.id,
      prev: [],
    };
    nodes[stub.id] = stub;
    node.stub = stub.id;
    var prev2 = [];
    for (var prevId of node.prev) {
      if (prevId in node.noloop) {
        prev2.push(prevId);
      } else {
        stub.prev.push(prevId);
        var prev = nodes[prevId];
        redirectNode(nodes, prev, node.id, stub.id);
      }
    }
    node.prev = prev2;
    return stub;
  }

  function onError(message, nodeId) {
    throw createError(
      translate(message),
      filename,
      nodeId
    );
  }

  function structMain() {
    rewireArrows(nodes, branches);
    prepareQuestions(nodes);
    var result = [];

    for (var branch of branches) {
      flow_no_loop(nodes, branch.next, []);
    }

    for (var branch of branches) {
      var body = [];
      buildTree(nodes, branch.next, body, "<dummy id>", undefined, onError);

      result.push({
        name: branch.content,
        branchId: branch.branchId,
        id: branch.id,        
        refs: branch.prev.length,
        body: optimizeTree(body),
      });
    }

    return sortByProperty(result, "branchId");
  }

  return structMain();
}
module.exports = { structFlow, redirectNode };
