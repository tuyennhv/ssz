"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNodeFromCompactMultiProof = exports.createCompactMultiProof = exports.compactMultiProofToNode = exports.nodeToCompactMultiProof = exports.descriptorToBitlist = exports.computeDescriptor = void 0;
const gindex_1 = require("../gindex");
const node_1 = require("../node");
const util_1 = require("./util");
function computeDescriptor(indices) {
    // include all helper indices
    const proofBitstrings = new Set();
    const pathBitstrings = new Set();
    for (const leafIndex of indices) {
        const leafBitstring = gindex_1.convertGindexToBitstring(leafIndex);
        proofBitstrings.add(leafBitstring);
        const { branch, path } = util_1.computeProofBitstrings(leafBitstring);
        path.delete(leafBitstring);
        for (const pathIndex of path) {
            pathBitstrings.add(pathIndex);
        }
        for (const branchIndex of branch) {
            proofBitstrings.add(branchIndex);
        }
    }
    for (const pathIndex of pathBitstrings) {
        proofBitstrings.delete(pathIndex);
    }
    // sort gindex bitstrings in-order
    const allBitstringsSorted = Array.from(proofBitstrings).sort((a, b) => a.localeCompare(b));
    // convert gindex bitstrings into descriptor bitstring
    let descriptorBitstring = "";
    for (const gindexBitstring of allBitstringsSorted) {
        for (let i = 0; i < gindexBitstring.length; i++) {
            if (gindexBitstring[gindexBitstring.length - 1 - i] === "1") {
                descriptorBitstring += "1".padStart(i + 1, "0");
                break;
            }
        }
    }
    // append zero bits to byte-alignt
    if (descriptorBitstring.length % 8 != 0) {
        descriptorBitstring = descriptorBitstring.padEnd(8 - (descriptorBitstring.length % 8) + descriptorBitstring.length, "0");
    }
    // convert descriptor bitstring to bytes
    const descriptor = new Uint8Array(descriptorBitstring.length / 8);
    for (let i = 0; i < descriptor.length; i++) {
        descriptor[i] = Number("0b" + descriptorBitstring.substring(i * 8, (i + 1) * 8));
    }
    return descriptor;
}
exports.computeDescriptor = computeDescriptor;
function getBit(bitlist, bitIndex) {
    const bit = bitIndex % 8;
    const byteIdx = Math.floor(bitIndex / 8);
    const byte = bitlist[byteIdx];
    switch (bit) {
        case 0:
            return (byte & 0b1000_0000) !== 0;
        case 1:
            return (byte & 0b0100_0000) !== 0;
        case 2:
            return (byte & 0b0010_0000) !== 0;
        case 3:
            return (byte & 0b0001_0000) !== 0;
        case 4:
            return (byte & 0b0000_1000) !== 0;
        case 5:
            return (byte & 0b0000_0100) !== 0;
        case 6:
            return (byte & 0b0000_0010) !== 0;
        case 7:
            return (byte & 0b0000_0001) !== 0;
        default:
            throw new Error("unreachable");
    }
}
function descriptorToBitlist(descriptor) {
    const bools = [];
    const maxBitLength = descriptor.length * 8;
    let count0 = 0;
    let count1 = 0;
    for (let i = 0; i < maxBitLength; i++) {
        const bit = getBit(descriptor, i);
        bools.push(bit);
        if (bit) {
            count1++;
        }
        else {
            count0++;
        }
        if (count1 > count0) {
            i++;
            if (i + 7 < maxBitLength) {
                throw new Error("Invalid descriptor: too many bytes");
            }
            for (; i < maxBitLength; i++) {
                const bit = getBit(descriptor, i);
                if (bit) {
                    throw new Error("Invalid descriptor: too many 1 bits");
                }
            }
            return bools;
        }
    }
    throw new Error("Invalid descriptor: not enough 1 bits");
}
exports.descriptorToBitlist = descriptorToBitlist;
function nodeToCompactMultiProof(node, bitlist, bitIndex) {
    if (bitlist[bitIndex]) {
        return [node.root];
    }
    else {
        const left = nodeToCompactMultiProof(node.left, bitlist, bitIndex + 1);
        const right = nodeToCompactMultiProof(node.right, bitlist, bitIndex + left.length * 2);
        return [...left, ...right];
    }
}
exports.nodeToCompactMultiProof = nodeToCompactMultiProof;
/**
 * Create a Node given a validated bitlist, leaves, and a pointer into the bitlist and leaves
 *
 * Recursive definition
 */
function compactMultiProofToNode(bitlist, leaves, pointer) {
    if (bitlist[pointer.bitIndex++]) {
        return node_1.LeafNode.fromRoot(leaves[pointer.leafIndex++]);
    }
    else {
        return new node_1.BranchNode(compactMultiProofToNode(bitlist, leaves, pointer), compactMultiProofToNode(bitlist, leaves, pointer));
    }
}
exports.compactMultiProofToNode = compactMultiProofToNode;
function createCompactMultiProof(rootNode, descriptor) {
    return nodeToCompactMultiProof(rootNode, descriptorToBitlist(descriptor), 0);
}
exports.createCompactMultiProof = createCompactMultiProof;
function createNodeFromCompactMultiProof(leaves, descriptor) {
    const bools = descriptorToBitlist(descriptor);
    if (bools.length !== leaves.length * 2 - 1) {
        throw new Error("Invalid multiproof: invalid number of leaves");
    }
    return compactMultiProofToNode(bools, leaves, { bitIndex: 0, leafIndex: 0 });
}
exports.createNodeFromCompactMultiProof = createNodeFromCompactMultiProof;
//# sourceMappingURL=compactMulti.js.map