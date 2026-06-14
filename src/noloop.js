function decrement_arrow_count(context, node) {
    var algonode;
    algonode = context.nodes[node.arrow];
    algonode.branching--;
}
function decrement_if_count(context, node) {
    var _collection_12, if_id, if_node;
    _collection_12 = node.stack;
    for (if_id of _collection_12) {
        if_node = context.nodes[if_id];
        if_node.branching--;
    }
}
function flow_no_loop(nodes, start_node_id) {
    var context;
    context = { nodes: nodes };
    traverse_node(context, start_node_id, []);
}
function group_stack_by_id(stack) {
    var counts_by_id, element, existing;
    counts_by_id = {};
    for (element of stack) {
        if (element in counts_by_id) {
            existing = counts_by_id[element];
        } else {
            existing = 0;
        }
        counts_by_id[element] = existing + 1;
    }
    return counts_by_id;
}
function increment_if_count(context, node) {
    var _collection_14, if_id, if_node;
    _collection_14 = node.stack;
    for (if_id of _collection_14) {
        if_node = context.nodes[if_id];
        if_node.branching++;
    }
}
function is_in_map(map, key) {
    if (map) {
        return key in map;
    } else {
        return false;
    }
}
function merge_converging_branches(context, node_id, node, stack) {
    var algonode, algonode_id, common, count, counts_by_id, processed_stack, stub;
    common = node.stack.concat(stack);
    counts_by_id = group_stack_by_id(common);
    for (algonode_id in counts_by_id) {
        count = counts_by_id[algonode_id];
        algonode = context.nodes[algonode_id];
        if (!algonode.next && algonode.type == 'arrow-loop') {
            algonode.branching -= count - 1;
            if (!(algonode.branching > 1 || is_in_map(node.astack, algonode_id))) {
                stub = context.nodes[algonode.stub];
                decrement_if_count(context, stub);
                stub.one = node_id;
                algonode.next = node_id;
            }
        }
    }
    processed_stack = [];
    for (algonode_id in counts_by_id) {
        count = counts_by_id[algonode_id];
        algonode = context.nodes[algonode_id];
        if (!algonode.next) {
            if (algonode.type == 'question') {
                algonode.branching -= count - 1;
                if (algonode.branching > 1) {
                    processed_stack.push(algonode_id);
                } else {
                    algonode.next = node_id;
                }
            } else {
                processed_stack.push(algonode_id);
            }
        }
    }
    node.stack = processed_stack;
}
function recurse_traversal(context, node_id, node) {
    var _collection_20, _selectValue_18, proc, stack1, stack2;
    _selectValue_18 = node.type;
    if (_selectValue_18 === 'question') {
        increment_if_count(context, node);
        stack1 = node.stack.slice();
        stack1.push(node_id);
        stack2 = node.stack.slice();
        stack2.push(node_id);
        traverse_node(context, node.two, stack2);
        traverse_node(context, node.one, stack1);
    } else {
        if (_selectValue_18 === 'arrow-loop') {
            stack1 = node.stack.slice();
            stack1.push(node_id);
            traverse_node(context, node.one, stack1);
        } else {
            if (_selectValue_18 === 'arrow-stub') {
                decrement_arrow_count(context, node);
            } else {
                if (_selectValue_18 === 'parbegin') {
                    _collection_20 = node.procs;
                    for (proc of _collection_20) {
                        flow_no_loop(context.nodes, proc.start);
                    }
                } else {
                    if (node.final) {
                        decrement_if_count(context, node);
                    } else {
                        stack1 = node.stack.slice();
                        traverse_node(context, node.one, stack1);
                    }
                }
            }
        }
    }
}
function traverse_node(context, node_id, stack) {
    var node;
    if (node_id) {
        node = context.nodes[node_id];
        if (!node.stack) {
            node.stack = [];
            node.refs = node.prev.length;
        }
        node.refs--;
        merge_converging_branches(context, node_id, node, stack);
        if (!(node.refs > 0)) {
            recurse_traversal(context, node_id, node);
        }
    }
}
module.exports = { flow_no_loop };