"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deserializeProof = exports.serializeProof = exports.createNodeFromProof = exports.createProof = exports.ProofTypeSerialized = exports.ProofType = exports.descriptorToBitlist = exports.computeDescriptor = void 0;
const multi_1 = require("./multi");
const compactMulti_1 = require("./compactMulti");
const single_1 = require("./single");
const treeOffset_1 = require("./treeOffset");
var compactMulti_2 = require("./compactMulti");
Object.defineProperty(exports, "computeDescriptor", { enumerable: true, get: function () { return compactMulti_2.computeDescriptor; } });
Object.defineProperty(exports, "descriptorToBitlist", { enumerable: true, get: function () { return compactMulti_2.descriptorToBitlist; } });
var ProofType;
(function (ProofType) {
    ProofType["single"] = "single";
    ProofType["treeOffset"] = "treeOffset";
    ProofType["multi"] = "multi";
    ProofType["compactMulti"] = "compactMulti";
})(ProofType = exports.ProofType || (exports.ProofType = {}));
/**
 * Serialized proofs are prepended with a single byte, denoting their type
 */
exports.ProofTypeSerialized = [
    ProofType.single,
    ProofType.treeOffset,
    ProofType.multi,
    ProofType.compactMulti, // 3
];
function createProof(rootNode, input) {
    switch (input.type) {
        case ProofType.single: {
            const [leaf, witnesses] = single_1.createSingleProof(rootNode, input.gindex);
            return {
                type: ProofType.single,
                gindex: input.gindex,
                leaf,
                witnesses,
            };
        }
        case ProofType.treeOffset: {
            const [offsets, leaves] = treeOffset_1.createTreeOffsetProof(rootNode, input.gindices);
            return {
                type: ProofType.treeOffset,
                offsets,
                leaves,
            };
        }
        case ProofType.multi: {
            const [leaves, witnesses, gindices] = multi_1.createMultiProof(rootNode, input.gindices);
            return {
                type: ProofType.multi,
                leaves,
                witnesses,
                gindices,
            };
        }
        case ProofType.compactMulti: {
            const leaves = compactMulti_1.createCompactMultiProof(rootNode, input.descriptor);
            return {
                type: ProofType.compactMulti,
                leaves,
                descriptor: input.descriptor,
            };
        }
        default:
            throw new Error("Invalid proof type");
    }
}
exports.createProof = createProof;
function createNodeFromProof(proof) {
    switch (proof.type) {
        case ProofType.single:
            return single_1.createNodeFromSingleProof(proof.gindex, proof.leaf, proof.witnesses);
        case ProofType.treeOffset:
            return treeOffset_1.createNodeFromTreeOffsetProof(proof.offsets, proof.leaves);
        case ProofType.multi:
            return multi_1.createNodeFromMultiProof(proof.leaves, proof.witnesses, proof.gindices);
        case ProofType.compactMulti:
            return compactMulti_1.createNodeFromCompactMultiProof(proof.leaves, proof.descriptor);
        default:
            throw new Error("Invalid proof type");
    }
}
exports.createNodeFromProof = createNodeFromProof;
function serializeProof(proof) {
    switch (proof.type) {
        case ProofType.single:
        case ProofType.multi:
            throw new Error("Not implemented");
        case ProofType.treeOffset: {
            const output = new Uint8Array(1 + treeOffset_1.computeTreeOffsetProofSerializedLength(proof.offsets, proof.leaves));
            output[0] = exports.ProofTypeSerialized.indexOf(ProofType.treeOffset);
            treeOffset_1.serializeTreeOffsetProof(output, 1, proof.offsets, proof.leaves);
            return output;
        }
        default:
            throw new Error("Invalid proof type");
    }
}
exports.serializeProof = serializeProof;
function deserializeProof(data) {
    const proofType = exports.ProofTypeSerialized[data[0]];
    if (!proofType) {
        throw new Error("Invalid proof type");
    }
    switch (proofType) {
        case ProofType.single:
        case ProofType.multi:
            throw new Error("Not implemented");
        case ProofType.treeOffset: {
            const [offsets, leaves] = treeOffset_1.deserializeTreeOffsetProof(data, 1);
            return {
                type: ProofType.treeOffset,
                offsets,
                leaves,
            };
        }
        default:
            throw new Error("Invalid proof type");
    }
}
exports.deserializeProof = deserializeProof;
//# sourceMappingURL=index.js.map