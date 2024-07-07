"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.packedNodeRootsToBytes = exports.packedRootsBytesToLeafNodes = exports.packedUintNum64sToLeafNodes = exports.packedRootsBytesToNode = void 0;
const subtree_1 = require("./subtree");
const node_1 = require("./node");
const NUMBER_2_POW_32 = 2 ** 32;
function packedRootsBytesToNode(depth, dataView, start, end) {
    const leafNodes = packedRootsBytesToLeafNodes(dataView, start, end);
    return subtree_1.subtreeFillToContents(leafNodes, depth);
}
exports.packedRootsBytesToNode = packedRootsBytesToNode;
/**
 * Pack a list of uint64 numbers into a list of LeafNodes.
 * Each value is UintNum64, which is 8 bytes long, which is 2 h values.
 * Each 4 of them forms a LeafNode.
 *
 *      v0            v1           v2          v3
 * |-------------|-------------|-------------|-------------|
 *
 *    h0     h1     h2     h3     h4     h5     h6     h7
 * |------|------|------|------|------|------|------|------|
 */
function packedUintNum64sToLeafNodes(values) {
    const leafNodes = new Array(Math.ceil(values.length / 4));
    for (let i = 0; i < values.length; i++) {
        const nodeIndex = Math.floor(i / 4);
        const leafNode = leafNodes[nodeIndex] ?? new node_1.LeafNode(0, 0, 0, 0, 0, 0, 0, 0);
        const vIndex = i % 4;
        const hIndex = 2 * vIndex;
        const value = values[i];
        // same logic to UintNumberType.value_serializeToBytes() for 8 bytes
        if (value === Infinity) {
            node_1.setNodeH(leafNode, hIndex, 0xffffffff);
            node_1.setNodeH(leafNode, hIndex + 1, 0xffffffff);
        }
        else {
            node_1.setNodeH(leafNode, hIndex, value & 0xffffffff);
            node_1.setNodeH(leafNode, hIndex + 1, (value / NUMBER_2_POW_32) & 0xffffffff);
        }
        leafNodes[nodeIndex] = leafNode;
    }
    return leafNodes;
}
exports.packedUintNum64sToLeafNodes = packedUintNum64sToLeafNodes;
/**
 * Optimized deserialization of linear bytes to consecutive leaf nodes
 */
function packedRootsBytesToLeafNodes(dataView, start, end) {
    const size = end - start;
    // If the offset in data is not a multiple of 4, Uint32Array can't be used
    // > start offset of Uint32Array should be a multiple of 4
    // NOTE: Performance tests show that using a DataView is as fast as Uint32Array
    const fullNodeCount = Math.floor(size / 32);
    const leafNodes = new Array(Math.ceil(size / 32));
    // Efficiently construct the tree writing to hashObjects directly
    // TODO: Optimize, with this approach each h property is written twice
    for (let i = 0; i < fullNodeCount; i++) {
        const offset = start + i * 32;
        leafNodes[i] = new node_1.LeafNode(dataView.getInt32(offset + 0, true), dataView.getInt32(offset + 4, true), dataView.getInt32(offset + 8, true), dataView.getInt32(offset + 12, true), dataView.getInt32(offset + 16, true), dataView.getInt32(offset + 20, true), dataView.getInt32(offset + 24, true), dataView.getInt32(offset + 28, true));
    }
    // Consider that the last node may only include partial data
    const remainderBytes = size % 32;
    // Last node
    if (remainderBytes > 0) {
        const node = new node_1.LeafNode(0, 0, 0, 0, 0, 0, 0, 0);
        leafNodes[fullNodeCount] = node;
        // Loop to dynamically copy the full h values
        const fullHCount = Math.floor(remainderBytes / 4);
        for (let h = 0; h < fullHCount; h++) {
            node_1.setNodeH(node, h, dataView.getInt32(start + fullNodeCount * 32 + h * 4, true));
        }
        const remainderUint32 = size % 4;
        if (remainderUint32 > 0) {
            let h = 0;
            for (let i = 0; i < remainderUint32; i++) {
                h |= dataView.getUint8(start + size - remainderUint32 + i) << (i * 8);
            }
            node_1.setNodeH(node, fullHCount, h);
        }
    }
    return leafNodes;
}
exports.packedRootsBytesToLeafNodes = packedRootsBytesToLeafNodes;
/**
 * Optimized serialization of consecutive leave nodes to linear bytes
 */
function packedNodeRootsToBytes(dataView, start, size, nodes) {
    // If the offset in data is not a multiple of 4, Uint32Array can't be used
    // > start offset of Uint32Array should be a multiple of 4
    // NOTE: Performance tests show that using a DataView is as fast as Uint32Array
    // Consider that the last node may only include partial data
    const remainderBytes = size % 32;
    // Full nodes
    // Efficiently get hashObjects data into data
    const fullNodeCount = Math.floor(size / 32);
    for (let i = 0; i < fullNodeCount; i++) {
        const node = nodes[i];
        const offset = start + i * 32;
        dataView.setInt32(offset + 0, node.h0, true);
        dataView.setInt32(offset + 4, node.h1, true);
        dataView.setInt32(offset + 8, node.h2, true);
        dataView.setInt32(offset + 12, node.h3, true);
        dataView.setInt32(offset + 16, node.h4, true);
        dataView.setInt32(offset + 20, node.h5, true);
        dataView.setInt32(offset + 24, node.h6, true);
        dataView.setInt32(offset + 28, node.h7, true);
    }
    // Last node
    if (remainderBytes > 0) {
        const node = nodes[fullNodeCount];
        // Loop to dynamically copy the full h values
        const fullHCount = Math.floor(remainderBytes / 4);
        for (let h = 0; h < fullHCount; h++) {
            dataView.setInt32(start + fullNodeCount * 32 + h * 4, node_1.getNodeH(node, h), true);
        }
        const remainderUint32 = size % 4;
        if (remainderUint32 > 0) {
            const h = node_1.getNodeH(node, fullHCount);
            for (let i = 0; i < remainderUint32; i++) {
                dataView.setUint8(start + size - remainderUint32 + i, (h >> (i * 8)) & 0xff);
            }
        }
    }
}
exports.packedNodeRootsToBytes = packedNodeRootsToBytes;
//# sourceMappingURL=packedNode.js.map