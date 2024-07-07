"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.subtreeFillToContents = exports.subtreeFillToLength = exports.subtreeFillToDepth = void 0;
const node_1 = require("./node");
const zeroNode_1 = require("./zeroNode");
function subtreeFillToDepth(bottom, depth) {
    let node = bottom;
    while (depth > 0) {
        node = new node_1.BranchNode(node, node);
        depth--;
    }
    return node;
}
exports.subtreeFillToDepth = subtreeFillToDepth;
function subtreeFillToLength(bottom, depth, length) {
    const maxLength = 1 << depth;
    if (length > maxLength)
        throw new Error("ERR_TOO_MANY_NODES");
    if (length === maxLength)
        return subtreeFillToDepth(bottom, depth);
    if (depth === 0) {
        if (length === 1)
            return bottom;
        else
            throw new Error("ERR_NAVIGATION");
    }
    if (depth === 1) {
        return new node_1.BranchNode(bottom, length > 1 ? bottom : zeroNode_1.zeroNode(0));
    }
    const pivot = maxLength >> 1;
    if (length <= pivot) {
        return new node_1.BranchNode(subtreeFillToLength(bottom, depth - 1, length), zeroNode_1.zeroNode(depth - 1));
    }
    else {
        return new node_1.BranchNode(subtreeFillToDepth(bottom, depth - 1), subtreeFillToLength(bottom, depth - 1, length - pivot));
    }
}
exports.subtreeFillToLength = subtreeFillToLength;
/**
 * WARNING: Mutates the provided nodes array.
 * @param hashCompRootNode is a hacky way from ssz to set `dest` of HashComputation for BranchNodeStruct
 * TODO: Don't mutate the nodes array.
 * TODO - batch: check consumers of this function, can we compute HashComputationGroup when deserializing ViewDU from Uint8Array?
 */
function subtreeFillToContents(nodes, depth, hashComps = null, hashCompRootNode = null) {
    const maxLength = 2 ** depth;
    if (nodes.length > maxLength) {
        throw new Error(`nodes.length ${nodes.length} over maxIndex at depth ${depth}`);
    }
    if (nodes.length === 0) {
        return zeroNode_1.zeroNode(depth);
    }
    if (depth === 0) {
        const node = nodes[0];
        if (hashComps !== null) {
            // only use hashCompRootNode for >=1 nodes where we have a rebind
            node_1.getHashComputations(node, hashComps.offset, hashComps.byLevel);
        }
        return node;
    }
    if (depth === 1) {
        // All nodes at depth 1 available
        // If there is only one node, pad with zero node
        const leftNode = nodes[0];
        const rightNode = nodes.length > 1 ? nodes[1] : zeroNode_1.zeroNode(0);
        const rootNode = new node_1.BranchNode(leftNode, rightNode);
        if (hashComps !== null) {
            const offset = hashComps.offset;
            node_1.getHashComputations(leftNode, offset + 1, hashComps.byLevel);
            node_1.getHashComputations(rightNode, offset + 1, hashComps.byLevel);
            node_1.arrayAtIndex(hashComps.byLevel, offset).push({
                src0: leftNode,
                src1: rightNode,
                dest: hashCompRootNode ?? rootNode,
            });
        }
        return rootNode;
    }
    let count = nodes.length;
    for (let d = depth; d > 0; d--) {
        const countRemainder = count % 2;
        const countEven = count - countRemainder;
        const offset = hashComps ? hashComps.offset + d - 1 : null;
        // For each depth level compute the new BranchNodes and overwrite the nodes array
        for (let i = 0; i < countEven; i += 2) {
            const left = nodes[i];
            const right = nodes[i + 1];
            const node = new node_1.BranchNode(left, right);
            nodes[i / 2] = node;
            if (offset !== null && hashComps !== null) {
                node_1.arrayAtIndex(hashComps.byLevel, offset).push({
                    src0: left,
                    src1: right,
                    // d = 1 means we are at root node, use hashCompRootNode if possible
                    dest: d === 1 ? hashCompRootNode ?? node : node,
                });
                if (d === depth) {
                    // bottom up strategy so we don't need to go down the tree except for the last level
                    node_1.getHashComputations(left, offset + 1, hashComps.byLevel);
                    node_1.getHashComputations(right, offset + 1, hashComps.byLevel);
                }
            }
        }
        if (countRemainder > 0) {
            const left = nodes[countEven];
            const right = zeroNode_1.zeroNode(depth - d);
            const node = new node_1.BranchNode(left, right);
            nodes[countEven / 2] = node;
            if (offset !== null && hashComps !== null) {
                if (d === depth) {
                    // only go down on the last level
                    node_1.getHashComputations(left, offset + 1, hashComps.byLevel);
                }
                // no need to getHashComputations for zero node
                // no need to set hashCompRootNode here
                node_1.arrayAtIndex(hashComps.byLevel, offset).push({ src0: left, src1: right, dest: node });
            }
        }
        // If there was remainer, 2 nodes are added to the count
        count = countEven / 2 + countRemainder;
    }
    return nodes[0];
}
exports.subtreeFillToContents = subtreeFillToContents;
//# sourceMappingURL=subtree.js.map