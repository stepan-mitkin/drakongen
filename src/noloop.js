"use strict";

function decrement_if_count(context, node) {
    var i;
    var if_id;
    var if_node;

    for (i = 0; i < node.stack.length; i++) {
        if_id = node.stack[i];
        if_node = context.nodes[if_id];
        if_node.branching--;
    }
}

function flow_no_loop(nodes, start_node_id) {
    var context;

    context = {
        nodes: nodes
    };

    traverse_node(
        context,
        start_node_id,
        []
    );
}

function group_stack_by_id(stack) {
    var counts_by_id;
    var i;
    var element;
    var existing;

    counts_by_id = {};

    for (i = 0; i < stack.length; i++) {
        element = stack[i];

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
    var i;
    var if_id;
    var if_node;

    for (i = 0; i < node.stack.length; i++) {
        if_id = node.stack[i];
        if_node = context.nodes[if_id];
        if_node.branching++;
    }
}

function merge_incoming_branches(context, node_id, node, stack) {
    var common;
    var counts_by_id;
    var processed_stack;
    var ids;
    var i;
    var id;
    var count;
    var if_node;

    common = node.stack.concat(stack);
    counts_by_id = group_stack_by_id(common);
    processed_stack = [];

    ids = Object.keys(counts_by_id);

    for (i = 0; i < ids.length; i++) {
        id = ids[i];
        count = counts_by_id[id];

        if_node = context.nodes[id];

        if (!if_node.next) {
            if (if_node.branching === 1) {
                if_node.next = node_id;
            } else {
                if_node.branching -= count - 1;

                if (if_node.branching === 1) {
                    if_node.next = node_id;
                } else {
                    processed_stack.push(id);
                }
            }
        }
    }

    node.stack = processed_stack;
}

function recurse_traversal(context, node_id, node) {
    var stack1;
    var stack2;

    if (node.type === "question") {
        increment_if_count(
            context,
            node
        );

        stack1 = node.stack.slice();
        stack1.push(node_id);

        stack2 = node.stack.slice();
        stack2.push(node_id);

        traverse_node(
            context,
            node.one,
            stack1
        );

        traverse_node(
            context,
            node.two,
            stack2
        );
    } else {
        if (node.final) {
            decrement_if_count(
                context,
                node
            );
        } else {
            stack1 = node.stack.slice();

            traverse_node(
                context,
                node.one,
                stack1
            );
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

        merge_incoming_branches(
            context,
            node_id,
            node,
            stack
        );

        if (!(node.refs > 0)) {
            recurse_traversal(
                context,
                node_id,
                node
            );
        }
    }
}

module.exports = {
    flow_no_loop: flow_no_loop
};