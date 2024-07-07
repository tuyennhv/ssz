"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BitArrayType = void 0;
const persistent_merkle_tree_1 = require("@chainsafe/persistent-merkle-tree");
const byteArray_1 = require("../util/byteArray");
const composite_1 = require("./composite");
const bitArray_1 = require("../view/bitArray");
const bitArray_2 = require("../viewDU/bitArray");
const byteArray_2 = require("./byteArray");
/* eslint-disable @typescript-eslint/member-ordering */
/**
 * BitArray: ordered array collection of boolean values
 * - Value: `BitArray`, @see BitArray for a justification of its memory efficiency and performance
 * - View: `BitArrayTreeView`
 * - ViewDU: `BitArrayTreeViewDU`
 */
class BitArrayType extends composite_1.CompositeType {
    constructor() {
        super(...arguments);
        this.isViewMutable = true;
    }
    getView(tree) {
        return new bitArray_1.BitArrayTreeView(this, tree);
    }
    getViewDU(node) {
        return new bitArray_2.BitArrayTreeViewDU(this, node);
    }
    commitView(view) {
        return view.node;
    }
    commitViewDU(view, hashComps = null) {
        view.commit(hashComps);
        return view.node;
    }
    cacheOfViewDU(view) {
        return view.cache;
    }
    // Merkleization
    getChunkBytes(value) {
        // reallocate this.merkleBytes if needed
        if (value.uint8Array.length > this.chunkBytesBuffer.length) {
            const chunkCount = Math.ceil(value.bitLen / 8 / 32);
            const chunkBytes = chunkCount * 32;
            // pad 1 chunk if maxChunkCount is not even
            this.chunkBytesBuffer = chunkCount % 2 === 1 ? new Uint8Array(chunkBytes + 32) : new Uint8Array(chunkBytes);
        }
        return byteArray_2.getChunkBytes(value.uint8Array, this.chunkBytesBuffer);
    }
    // Proofs
    getPropertyGindex() {
        // Stop navigating below this type. Must only request complete data
        return null;
    }
    getPropertyType() {
        /* istanbul ignore next - unreachable code, getPropertyGindex null return prevents this call */
        throw Error("Must only request BitArray complete data");
    }
    getIndexProperty() {
        /* istanbul ignore next - unreachable code, getPropertyGindex null return prevents this call */
        throw Error("Must only request BitArray complete data");
    }
    tree_fromProofNode(node) {
        return { node, done: true };
    }
    tree_getLeafGindices(rootGindex, rootNode) {
        const byteLen = this.tree_getByteLen(rootNode);
        const chunkCount = Math.ceil(byteLen / 32);
        const startIndex = persistent_merkle_tree_1.concatGindices([rootGindex, persistent_merkle_tree_1.toGindex(this.depth, BigInt(0))]);
        const gindices = new Array(chunkCount);
        for (let i = 0, gindex = startIndex; i < chunkCount; i++, gindex++) {
            gindices[i] = gindex;
        }
        // include the length chunk
        if (this.isList) {
            gindices.push(persistent_merkle_tree_1.concatGindices([rootGindex, composite_1.LENGTH_GINDEX]));
        }
        return gindices;
    }
    // JSON
    fromJson(json) {
        const uint8Array = byteArray_1.fromHexString(json);
        const dataView = new DataView(uint8Array.buffer, uint8Array.byteOffset, uint8Array.byteLength);
        // value_deserializeFromBytes MUST validate length (limit, or length)
        return this.value_deserializeFromBytes({ uint8Array, dataView }, 0, uint8Array.length);
    }
    toJson(value) {
        return byteArray_1.toHexString(this.serialize(value));
    }
    clone(value) {
        return value.clone();
    }
    equals(a, b) {
        return a.bitLen === b.bitLen && byteArray_1.byteArrayEquals(a.uint8Array, b.uint8Array);
    }
}
exports.BitArrayType = BitArrayType;
//# sourceMappingURL=bitArray.js.map