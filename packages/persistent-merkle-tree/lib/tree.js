"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findDiffDepthi = exports.treeZeroAfterIndex = exports.iterateNodesAtDepth = exports.getNodesAtDepth = exports.setNodesAtDepth = exports.setNodeAtDepth = exports.getNodeAtDepth = exports.setNodeWithFn = exports.setNode = exports.getNode = exports.Tree = void 0;
const zeroNode_1 = require("./zeroNode");
const gindex_1 = require("./gindex");
const node_1 = require("./node");
const proof_1 = require("./proof");
const single_1 = require("./proof/single");
/**
 * Binary merkle tree
 *
 * Wrapper around immutable `Node` to support mutability.
 *
 * Mutability between a parent tree and subtree is achieved by maintaining a `hook` callback, which updates the parent when the subtree is updated.
 */
class Tree {
    constructor(node, hook) {
        this._rootNode = node;
        if (hook) {
            if (typeof WeakRef === "undefined") {
                this.hook = hook;
            }
            else {
                this.hook = new WeakRef(hook);
            }
        }
    }
    /**
     * Create a `Tree` from a `Proof` object
     */
    static createFromProof(proof) {
        return new Tree(proof_1.createNodeFromProof(proof));
    }
    /**
     * The root node of the tree
     */
    get rootNode() {
        return this._rootNode;
    }
    /**
     *
     * Setting the root node will trigger a call to the tree's `hook` if it exists.
     */
    set rootNode(newRootNode) {
        this._rootNode = newRootNode;
        if (this.hook) {
            // WeakRef should not change status during a program's execution
            // So, use WeakRef feature detection to assume the type of this.hook
            // to minimize the memory footprint of Tree
            if (typeof WeakRef === "undefined") {
                this.hook(newRootNode);
            }
            else {
                const hookVar = this.hook.deref();
                if (hookVar) {
                    hookVar(newRootNode);
                }
                else {
                    // Hook has been garbage collected, no need to keep the hookRef
                    this.hook = undefined;
                }
            }
        }
    }
    /**
     * The root hash of the tree
     */
    get root() {
        return this.rootNode.root;
    }
    batchHash() {
        if (!this.rootNode.isLeaf()) {
            return this.rootNode.batchHash();
        }
        return this.root;
    }
    /**
     * Return a copy of the tree
     */
    clone() {
        return new Tree(this.rootNode);
    }
    /**
     * Return the subtree at the specified gindex.
     *
     * Note: The returned subtree will have a `hook` attached to the parent tree.
     * Updates to the subtree will result in updates to the parent.
     */
    getSubtree(index) {
        return new Tree(this.getNode(index), (node) => this.setNode(index, node));
    }
    /**
     * Return the node at the specified gindex.
     */
    getNode(gindex) {
        return getNode(this.rootNode, gindex);
    }
    /**
     * Return the node at the specified depth and index.
     *
     * Supports index up to `Number.MAX_SAFE_INTEGER`.
     */
    getNodeAtDepth(depth, index) {
        return getNodeAtDepth(this.rootNode, depth, index);
    }
    /**
     * Return the hash at the specified gindex.
     */
    getRoot(index) {
        return this.getNode(index).root;
    }
    /**
     * Set the node at at the specified gindex.
     */
    setNode(gindex, n) {
        this.rootNode = setNode(this.rootNode, gindex, n);
    }
    /**
     * Traverse to the node at the specified gindex,
     * then apply the function to get a new node and set the node at the specified gindex with the result.
     *
     * This is a convenient method to avoid traversing the tree 2 times to
     * get and set.
     */
    setNodeWithFn(gindex, getNewNode) {
        this.rootNode = setNodeWithFn(this.rootNode, gindex, getNewNode);
    }
    /**
     * Set the node at the specified depth and index.
     *
     * Supports index up to `Number.MAX_SAFE_INTEGER`.
     */
    setNodeAtDepth(depth, index, node) {
        this.rootNode = setNodeAtDepth(this.rootNode, depth, index, node);
    }
    /**
     * Set the hash at the specified gindex.
     *
     * Note: This will set a new `LeafNode` at the specified gindex.
     */
    setRoot(index, root) {
        this.setNode(index, node_1.LeafNode.fromRoot(root));
    }
    /**
     * Fast read-only iteration
     * In-order traversal of nodes at `depth`
     * starting from the `startIndex`-indexed node
     * iterating through `count` nodes
     *
     * Supports index up to `Number.MAX_SAFE_INTEGER`.
     */
    getNodesAtDepth(depth, startIndex, count) {
        return getNodesAtDepth(this.rootNode, depth, startIndex, count);
    }
    /**
     * Fast read-only iteration
     * In-order traversal of nodes at `depth`
     * starting from the `startIndex`-indexed node
     * iterating through `count` nodes
     *
     * Supports index up to `Number.MAX_SAFE_INTEGER`.
     */
    iterateNodesAtDepth(depth, startIndex, count) {
        return iterateNodesAtDepth(this.rootNode, depth, startIndex, count);
    }
    /**
     * Return a merkle proof for the node at the specified gindex.
     */
    getSingleProof(index) {
        return single_1.createSingleProof(this.rootNode, index)[1];
    }
    /**
     * Return a merkle proof for the proof input.
     *
     * This method can be used to create multiproofs.
     */
    getProof(input) {
        return proof_1.createProof(this.rootNode, input);
    }
}
exports.Tree = Tree;
/**
 * Return the node at the specified gindex.
 */
function getNode(rootNode, gindex) {
    const gindexBitstring = gindex_1.convertGindexToBitstring(gindex);
    let node = rootNode;
    for (let i = 1; i < gindexBitstring.length; i++) {
        if (node.isLeaf()) {
            throw new Error(`Invalid tree - found leaf at depth ${i}`);
        }
        // If bit is set, means navigate right
        node = gindexBitstring[i] === "1" ? node.right : node.left;
    }
    return node;
}
exports.getNode = getNode;
/**
 * Set the node at at the specified gindex.
 * Returns the new root node.
 */
function setNode(rootNode, gindex, n) {
    // Pre-compute entire bitstring instead of using an iterator (25% faster)
    const gindexBitstring = gindex_1.convertGindexToBitstring(gindex);
    const parentNodes = getParentNodes(rootNode, gindexBitstring);
    return rebindNodeToRoot(gindexBitstring, parentNodes, n);
}
exports.setNode = setNode;
/**
 * Traverse to the node at the specified gindex,
 * then apply the function to get a new node and set the node at the specified gindex with the result.
 *
 * This is a convenient method to avoid traversing the tree 2 times to
 * get and set.
 *
 * Returns the new root node.
 */
function setNodeWithFn(rootNode, gindex, getNewNode) {
    // Pre-compute entire bitstring instead of using an iterator (25% faster)
    const gindexBitstring = gindex_1.convertGindexToBitstring(gindex);
    const parentNodes = getParentNodes(rootNode, gindexBitstring);
    const lastParentNode = parentNodes[parentNodes.length - 1];
    const lastBit = gindexBitstring[gindexBitstring.length - 1];
    const oldNode = lastBit === "1" ? lastParentNode.right : lastParentNode.left;
    const newNode = getNewNode(oldNode);
    return rebindNodeToRoot(gindexBitstring, parentNodes, newNode);
}
exports.setNodeWithFn = setNodeWithFn;
/**
 * Traverse the tree from root node, ignore the last bit to get all parent nodes
 * of the specified bitstring.
 */
function getParentNodes(rootNode, bitstring) {
    let node = rootNode;
    // Keep a list of all parent nodes of node at gindex `index`. Then walk the list
    // backwards to rebind them "recursively" with the new nodes without using functions
    const parentNodes = [rootNode];
    // Ignore the first bit, left right directions are at bits [1,..]
    // Ignore the last bit, no need to push the target node to the parentNodes array
    for (let i = 1; i < bitstring.length - 1; i++) {
        // Compare to string directly to prevent unnecessary type conversions
        if (bitstring[i] === "1") {
            node = node.right;
        }
        else {
            node = node.left;
        }
        parentNodes.push(node);
    }
    return parentNodes;
}
/**
 * Build a new tree structure from bitstring, parentNodes and a new node.
 * Returns the new root node.
 */
function rebindNodeToRoot(bitstring, parentNodes, newNode) {
    let node = newNode;
    // Ignore the first bit, left right directions are at bits [1,..]
    // Iterate the list backwards including the last bit, but offset the parentNodes array
    // by one since the first bit in bitstring was ignored in the previous loop
    for (let i = bitstring.length - 1; i >= 1; i--) {
        if (bitstring[i] === "1") {
            node = new node_1.BranchNode(parentNodes[i - 1].left, node);
        }
        else {
            node = new node_1.BranchNode(node, parentNodes[i - 1].right);
        }
    }
    return node;
}
/**
 * Supports index up to `Number.MAX_SAFE_INTEGER`.
 */
function getNodeAtDepth(rootNode, depth, index) {
    if (depth === 0) {
        return rootNode;
    }
    if (depth === 1) {
        return index === 0 ? rootNode.left : rootNode.right;
    }
    // Ignore first bit "1", then substract 1 to get to the parent
    const depthiRoot = depth - 1;
    const depthiParent = 0;
    let node = rootNode;
    for (let d = depthiRoot; d >= depthiParent; d--) {
        node = isLeftNode(d, index) ? node.left : node.right;
    }
    return node;
}
exports.getNodeAtDepth = getNodeAtDepth;
/**
 * Supports index up to `Number.MAX_SAFE_INTEGER`.
 */
function setNodeAtDepth(rootNode, nodesDepth, index, nodeChanged) {
    // TODO: OPTIMIZE (if necessary)
    return setNodesAtDepth(rootNode, nodesDepth, [index], [nodeChanged]);
}
exports.setNodeAtDepth = setNodeAtDepth;
/**
 * Set multiple nodes in batch, editing and traversing nodes strictly once.
 *
 * - gindexes MUST be sorted in ascending order beforehand.
 * - All gindexes must be at the exact same depth.
 * - Depth must be > 0, if 0 just replace the root node.
 *
 * Strategy: for each gindex in `gindexes` navigate to the depth of its parent,
 * and create a new parent. Then calculate the closest common depth with the next
 * gindex and navigate upwards creating or caching nodes as necessary. Loop and repeat.
 *
 * Supports index up to `Number.MAX_SAFE_INTEGER`.
 * @param hashComps a map of HashComputation[] by level (could be from 0 to `nodesDepth - 1`)
 */
function setNodesAtDepth(rootNode, nodesDepth, indexes, nodes, hashComps = null) {
    // depth depthi   gindexes   indexes
    // 0     1           1          0
    // 1     0         2   3      0   1
    // 2     -        4 5 6 7    0 1 2 3
    // '10' means, at depth 1, node is at the left
    //
    // For index N check if the bit at position depthi is set to navigate right at depthi
    // ```
    // mask = 1 << depthi
    // goRight = (N & mask) == mask
    // ```
    // If depth is 0 there's only one node max and the optimization below will cause a navigation error.
    // For this case, check if there's a new root node and return it, otherwise the current rootNode.
    if (nodesDepth === 0) {
        return nodes.length > 0 ? nodes[0] : rootNode;
    }
    const hashCompsByLevel = hashComps?.byLevel ?? null;
    const offset = hashComps?.offset ?? 0;
    /**
     * Contiguous filled stack of parent nodes. It get filled in the first descent
     * Indexed by depthi
     */
    const parentNodeStack = new Array(nodesDepth);
    /**
     * Temp stack of left parent nodes, index by depthi.
     * Node leftParentNodeStack[depthi] is a node at d = depthi - 1, such that:
     * ```
     * parentNodeStack[depthi].left = leftParentNodeStack[depthi]
     * ```
     */
    const leftParentNodeStack = new Array(nodesDepth);
    // Ignore first bit "1", then substract 1 to get to the parent
    const depthiRoot = nodesDepth - 1;
    const depthiParent = 0;
    let depthi = depthiRoot;
    let node = rootNode;
    // Insert root node to make the loop below general
    parentNodeStack[depthiRoot] = rootNode;
    // TODO: Iterate to depth 32 to allow using bit ops
    // for (; depthi >= 32; depthi--) {
    //   node = node.left;
    // }
    for (let i = 0; i < indexes.length; i++) {
        const index = indexes[i];
        // Navigate down until parent depth, and store the chain of nodes
        //
        // Starts from latest common depth, so node is the parent node at `depthi`
        // When persisting the next node, store at the `d - 1` since its the child of node at `depthi`
        //
        // Stops at the level above depthiParent. For the re-binding routing below node must be at depthiParent
        for (let d = depthi; d > depthiParent; d--) {
            node = isLeftNode(d, index) ? node.left : node.right;
            parentNodeStack[d - 1] = node;
        }
        depthi = depthiParent;
        // If this is the left node, check first it the next node is on the right
        //
        //   -    If both nodes exist, create new
        //  / \
        // x   x
        //
        //   -    If only the left node exists, rebind left
        //  / \
        // x   -
        //
        //   -    If this is the right node, only the right node exists, rebind right
        //  / \
        // -   x
        // d = 0, mask = 1 << d = 1
        const isLeftLeafNode = (index & 1) !== 1;
        if (isLeftLeafNode) {
            // Next node is the very next to the right of current node
            if (index + 1 === indexes[i + 1]) {
                node = new node_1.BranchNode(nodes[i], nodes[i + 1]);
                if (hashCompsByLevel != null) {
                    // go with level of dest node (level 0 goes with root node)
                    // in this case dest node is nodesDept - 2, same for below
                    node_1.arrayAtIndex(hashCompsByLevel, nodesDepth - 1 + offset).push({
                        src0: nodes[i],
                        src1: nodes[i + 1],
                        dest: node,
                    });
                }
                // Move pointer one extra forward since node has consumed two nodes
                i++;
            }
            else {
                const oldNode = node;
                node = new node_1.BranchNode(nodes[i], oldNode.right);
                if (hashCompsByLevel != null) {
                    node_1.arrayAtIndex(hashCompsByLevel, nodesDepth - 1 + offset).push({
                        src0: nodes[i],
                        src1: oldNode.right,
                        dest: node,
                    });
                }
            }
        }
        else {
            const oldNode = node;
            node = new node_1.BranchNode(oldNode.left, nodes[i]);
            if (hashCompsByLevel != null) {
                node_1.arrayAtIndex(hashCompsByLevel, nodesDepth - 1 + offset).push({ src0: oldNode.left, src1: nodes[i], dest: node });
            }
        }
        // Here `node` is the new BranchNode at depthi `depthiParent`
        // Now climb upwards until finding the common node with the next index
        // For the last iteration, climb to the root at `depthiRoot`
        const isLastIndex = i >= indexes.length - 1;
        const diffDepthi = isLastIndex ? depthiRoot : findDiffDepthi(index, indexes[i + 1]);
        // When climbing up from a left node there are two possible paths
        // 1. Go to the right of the parent: Store left node to rebind latter
        // 2. Go another level up: Will never visit the left node again, so must rebind now
        // 🡼 \     Rebind left only, will never visit this node again
        // 🡽 /\
        //
        //    / 🡽  Rebind left only (same as above)
        // 🡽 /\
        //
        // 🡽 /\ 🡾  Store left node to rebind the entire node when returning
        //
        // 🡼 \     Rebind right with left if exists, will never visit this node again
        //   /\ 🡼
        //
        //    / 🡽  Rebind right with left if exists (same as above)
        //   /\ 🡼
        for (let d = depthiParent + 1; d <= diffDepthi; d++) {
            // If node is on the left, store for latter
            // If node is on the right merge with stored left node
            const depth = nodesDepth - d - 1;
            if (depth < 0) {
                throw Error(`Invalid depth ${depth}, d=${d}, nodesDepth=${nodesDepth}`);
            }
            if (isLeftNode(d, index)) {
                if (isLastIndex || d !== diffDepthi) {
                    // If it's last index, bind with parent since it won't navigate to the right anymore
                    // Also, if still has to move upwards, rebind since the node won't be visited anymore
                    const oldNode = node;
                    node = new node_1.BranchNode(oldNode, parentNodeStack[d].right);
                    if (hashCompsByLevel != null) {
                        node_1.arrayAtIndex(hashCompsByLevel, depth + offset).push({
                            src0: oldNode,
                            src1: parentNodeStack[d].right,
                            dest: node,
                        });
                    }
                }
                else {
                    // Only store the left node if it's at d = diffDepth
                    leftParentNodeStack[d] = node;
                    node = parentNodeStack[d];
                }
            }
            else {
                const leftNode = leftParentNodeStack[d];
                if (leftNode !== undefined) {
                    const oldNode = node;
                    node = new node_1.BranchNode(leftNode, oldNode);
                    if (hashCompsByLevel != null) {
                        node_1.arrayAtIndex(hashCompsByLevel, depth + offset).push({ src0: leftNode, src1: oldNode, dest: node });
                    }
                    leftParentNodeStack[d] = undefined;
                }
                else {
                    const oldNode = node;
                    node = new node_1.BranchNode(parentNodeStack[d].left, oldNode);
                    if (hashCompsByLevel != null) {
                        node_1.arrayAtIndex(hashCompsByLevel, depth + offset).push({
                            src0: parentNodeStack[d].left,
                            src1: oldNode,
                            dest: node,
                        });
                    }
                }
            }
        }
        // Prepare next loop
        // Go to the parent of the depth with diff, to switch branches to the right
        depthi = diffDepthi;
    }
    // Done, return new root node
    return node;
}
exports.setNodesAtDepth = setNodesAtDepth;
/**
 * Fast read-only iteration
 * In-order traversal of nodes at `depth`
 * starting from the `startIndex`-indexed node
 * iterating through `count` nodes
 *
 * **Strategy**
 * 1. Navigate down to parentDepth storing a stack of parents
 * 2. At target level push current node
 * 3. Go up to the first level that navigated left
 * 4. Repeat (1) for next index
 */
function getNodesAtDepth(rootNode, depth, startIndex, count) {
    // Optimized paths for short trees (x20 times faster)
    if (depth === 0) {
        return startIndex === 0 && count > 0 ? [rootNode] : [];
    }
    else if (depth === 1) {
        if (count === 0) {
            return [];
        }
        else if (count === 1) {
            return startIndex === 0 ? [rootNode.left] : [rootNode.right];
        }
        else {
            return [rootNode.left, rootNode.right];
        }
    }
    // Ignore first bit "1", then substract 1 to get to the parent
    const depthiRoot = depth - 1;
    const depthiParent = 0;
    let depthi = depthiRoot;
    let node = rootNode;
    // Contiguous filled stack of parent nodes. It get filled in the first descent
    // Indexed by depthi
    const parentNodeStack = new Array(depth);
    const isLeftStack = new Array(depth);
    const nodes = new Array(count);
    // Insert root node to make the loop below general
    parentNodeStack[depthiRoot] = rootNode;
    for (let i = 0; i < count; i++) {
        for (let d = depthi; d >= depthiParent; d--) {
            if (d !== depthi) {
                parentNodeStack[d] = node;
            }
            const isLeft = isLeftNode(d, startIndex + i);
            isLeftStack[d] = isLeft;
            node = isLeft ? node.left : node.right;
        }
        nodes[i] = node;
        // Find the first depth where navigation when left.
        // Store that height and go right from there
        for (let d = depthiParent; d <= depthiRoot; d++) {
            if (isLeftStack[d] === true) {
                depthi = d;
                break;
            }
        }
        node = parentNodeStack[depthi];
    }
    return nodes;
}
exports.getNodesAtDepth = getNodesAtDepth;
/**
 * @see getNodesAtDepth but instead of pushing to an array, it yields
 */
function* iterateNodesAtDepth(rootNode, depth, startIndex, count) {
    const endIndex = startIndex + count;
    // Ignore first bit "1", then substract 1 to get to the parent
    const depthiRoot = depth - 1;
    const depthiParent = 0;
    let depthi = depthiRoot;
    let node = rootNode;
    // Contiguous filled stack of parent nodes. It get filled in the first descent
    // Indexed by depthi
    const parentNodeStack = new Array(depth);
    const isLeftStack = new Array(depth);
    // Insert root node to make the loop below general
    parentNodeStack[depthiRoot] = rootNode;
    for (let index = startIndex; index < endIndex; index++) {
        for (let d = depthi; d >= depthiParent; d--) {
            if (d !== depthi) {
                parentNodeStack[d] = node;
            }
            const isLeft = isLeftNode(d, index);
            isLeftStack[d] = isLeft;
            node = isLeft ? node.left : node.right;
        }
        yield node;
        // Find the first depth where navigation when left.
        // Store that height and go right from there
        for (let d = depthiParent; d <= depthiRoot; d++) {
            if (isLeftStack[d] === true) {
                depthi = d;
                break;
            }
        }
        node = parentNodeStack[depthi];
    }
}
exports.iterateNodesAtDepth = iterateNodesAtDepth;
/**
 * Zero's all nodes right of index with constant depth of `nodesDepth`.
 *
 * For example, zero-ing this tree at depth 2 after index 0
 * ```
 *    X              X
 *  X   X    ->    X   0
 * X X X X        X 0 0 0
 * ```
 *
 * Or, zero-ing this tree at depth 3 after index 2
 * ```
 *        X                     X
 *    X       X             X       0
 *  X   X   X   X    ->   X   X   0   0
 * X X X X X X X X       X X X 0 0 0 0 0
 * ```
 *
 * The strategy is to first navigate down to `nodesDepth` and `index` and keep a stack of parents.
 * Then navigate up re-binding:
 * - If navigated to the left rebind with zeroNode()
 * - If navigated to the right rebind with parent.left from the stack
 */
function treeZeroAfterIndex(rootNode, nodesDepth, index) {
    // depth depthi   gindexes   indexes
    // 0     1           1          0
    // 1     0         2   3      0   1
    // 2     -        4 5 6 7    0 1 2 3
    // '10' means, at depth 1, node is at the left
    //
    // For index N check if the bit at position depthi is set to navigate right at depthi
    // ```
    // mask = 1 << depthi
    // goRight = (N & mask) == mask
    // ```
    // Degenerate case where tree is zero after a negative index (-1).
    // All positive indexes are zero, so the entire tree is zero. Return cached zero node as root.
    if (index < 0) {
        return zeroNode_1.zeroNode(nodesDepth);
    }
    /**
     * Contiguous filled stack of parent nodes. It get filled in the first descent
     * Indexed by depthi
     */
    const parentNodeStack = new Array(nodesDepth);
    // Ignore first bit "1", then substract 1 to get to the parent
    const depthiRoot = nodesDepth - 1;
    const depthiParent = 0;
    let depthi = depthiRoot;
    let node = rootNode;
    // Insert root node to make the loop below general
    parentNodeStack[depthiRoot] = rootNode;
    // Navigate down until parent depth, and store the chain of nodes
    //
    // Stops at the depthiParent level. To rebind below down to `nodesDepth`
    for (let d = depthi; d >= depthiParent; d--) {
        node = isLeftNode(d, index) ? node.left : node.right;
        parentNodeStack[d - 1] = node;
    }
    depthi = depthiParent;
    // Now climb up re-binding with either zero of existing tree.
    for (let d = depthiParent; d <= depthiRoot; d++) {
        if (isLeftNode(d, index)) {
            // If navigated to the left, then all the child nodes of the right node are NOT part of the new tree.
            // So re-bind new `node` with a zeroNode at the current depth.
            node = new node_1.BranchNode(node, zeroNode_1.zeroNode(d));
        }
        else {
            // If navigated to the right, then all the child nodes of the left node are part of the new tree.
            // So re-bind new `node` with the existing left node of the parent.
            node = new node_1.BranchNode(parentNodeStack[d].left, node);
        }
    }
    // Done, return new root node
    return node;
}
exports.treeZeroAfterIndex = treeZeroAfterIndex;
const NUMBER_32_MAX = 0xffffffff;
const NUMBER_2_POW_32 = 2 ** 32;
/**
 * depth depthi   gindexes   indexes
 * 0     1           1          0
 * 1     0         2   3      0   1
 * 2     -        4 5 6 7    0 1 2 3
 *
 * **Conditions**:
 * - `from` and `to` must not be equal
 *
 * @param from Index
 * @param to Index
 */
function findDiffDepthi(from, to) {
    if (from === to || from < 0 || to < 0) {
        throw Error(`Expect different positive inputs, from=${from} to=${to}`);
    }
    // 0 -> 0, 1 -> 1, 2 -> 2, 3 -> 2, 4 -> 3
    const numBits0 = Math.ceil(Math.log2(from + 1));
    const numBits1 = Math.ceil(Math.log2(to + 1));
    // these indexes stay in 2 sides of a merkle tree
    if (numBits0 !== numBits1) {
        // must offset by one to match the depthi scale
        return Math.max(numBits0, numBits1) - 1;
    }
    // same number of bits and > 32
    if (numBits0 > 32) {
        const highBits0 = Math.floor(from / NUMBER_2_POW_32) & NUMBER_32_MAX;
        const highBits1 = Math.floor(to / NUMBER_2_POW_32) & NUMBER_32_MAX;
        if (highBits0 === highBits1) {
            // different part is just low bits
            return findDiffDepthi32Bits(from & NUMBER_32_MAX, to & NUMBER_32_MAX);
        }
        // highBits are different, no need to compare low bits
        return 32 + findDiffDepthi32Bits(highBits0, highBits1);
    }
    // same number of bits and <= 32
    return findDiffDepthi32Bits(from, to);
}
exports.findDiffDepthi = findDiffDepthi;
/**
 * Returns true if the `index` at `depth` is a left node, false if it is a right node.
 *
 * Supports index up to `Number.MAX_SAFE_INTEGER`.
 * In Eth2 case the biggest tree's index is 2**40 (VALIDATOR_REGISTRY_LIMIT)
 */
function isLeftNode(depthi, index) {
    if (depthi > 31) {
        // Javascript can only do bitwise ops with 32 bit numbers.
        // Shifting left 1 by 32 wraps around and becomes 1.
        // Get the high part of `index` and adjust depthi
        const indexHi = (index / 2 ** 32) >>> 0;
        const mask = 1 << (depthi - 32);
        return (indexHi & mask) !== mask;
    }
    const mask = 1 << depthi;
    return (index & mask) !== mask;
}
/**
 * Similar to findDiffDepthi() but for 32-bit numbers only
 */
function findDiffDepthi32Bits(from, to) {
    const xor = from ^ to;
    if (xor === 0) {
        // this should not happen as checked in `findDiffDepthi`
        // otherwise this function return -1 which is weird for diffi
        throw Error(`Do not support equal value from=${from} to=${to}`);
    }
    // (0,0) -> 0 | (0,1) -> 1 | (0,2) -> 2
    // xor < 0 means the 1st bit of `from` and `to` is diffent, which mean num bits diff 32
    const numBitsDiff = xor < 0 ? 32 : Math.ceil(Math.log2(xor + 1));
    // must offset by one to match the depthi scale
    return numBitsDiff - 1;
}
//# sourceMappingURL=tree.js.map