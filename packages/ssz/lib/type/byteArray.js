"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getChunkBytes = exports.ByteArrayType = void 0;
const persistent_merkle_tree_1 = require("@chainsafe/persistent-merkle-tree");
const byteArray_1 = require("../util/byteArray");
const composite_1 = require("./composite");
/* eslint-disable @typescript-eslint/member-ordering */
/**
 * ByteArray: ordered array collection of byte values
 * - Value: `Uint8Array`
 * - View: `Uint8Array`
 * - ViewDU: `Uint8Array`
 *
 * ByteArray is an immutable value which is represented by a Uint8Array for memory efficiency and performance.
 * Note: Consumers of this type MUST never mutate the `Uint8Array` representation of a ByteArray.
 */
class ByteArrayType extends composite_1.CompositeType {
    constructor() {
        super(...arguments);
        this.isViewMutable = false;
    }
    defaultValue() {
        // Since it's a byte array the minSize is bytes is the default size
        return new Uint8Array(this.minSize);
    }
    getView(tree) {
        return this.getViewDU(tree.rootNode);
    }
    getViewDU(node) {
        return this.tree_toValue(node);
    }
    commitView(view) {
        return this.commitViewDU(view);
    }
    // TODO - batch
    commitViewDU(view) {
        const uint8Array = new Uint8Array(this.value_serializedSize(view));
        const dataView = new DataView(uint8Array.buffer, uint8Array.byteOffset, uint8Array.byteLength);
        this.value_serializeToBytes({ uint8Array, dataView }, 0, view);
        return this.tree_deserializeFromBytes({ uint8Array, dataView }, 0, uint8Array.length);
    }
    cacheOfViewDU() {
        return;
    }
    // Over-write to prevent serialize + deserialize
    toView(value) {
        return value;
    }
    toViewDU(value) {
        return value;
    }
    // Serialization + deserialization (only value is generic)
    value_serializeToBytes(output, offset, value) {
        output.uint8Array.set(value, offset);
        return offset + value.length;
    }
    value_deserializeFromBytes(data, start, end) {
        this.assertValidSize(end - start);
        return Uint8Array.prototype.slice.call(data.uint8Array, start, end);
    }
    value_toTree(value) {
        // this saves 1 allocation of Uint8Array
        const dataView = new DataView(value.buffer, value.byteOffset, value.byteLength);
        return this.tree_deserializeFromBytes({ uint8Array: value, dataView }, 0, value.length);
    }
    // Merkleization
    getChunkBytes(value) {
        // reallocate this.merkleBytes if needed
        if (value.length > this.chunkBytesBuffer.length) {
            const chunkCount = Math.ceil(value.length / 32);
            const chunkBytes = chunkCount * 32;
            // pad 1 chunk if maxChunkCount is not even
            this.chunkBytesBuffer = chunkCount % 2 === 1 ? new Uint8Array(chunkBytes + 32) : new Uint8Array(chunkBytes);
        }
        return getChunkBytes(value, this.chunkBytesBuffer);
    }
    // Proofs
    getPropertyGindex() {
        // Stop navigating below this type. Must only request complete data
        return null;
    }
    getPropertyType() {
        throw Error("Must only request ByteArray complete data");
    }
    getIndexProperty() {
        throw Error("Must only request ByteArray complete data");
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
        const value = byteArray_1.fromHexString(json);
        this.assertValidSize(value.length);
        return value;
    }
    toJson(value) {
        return byteArray_1.toHexString(value);
    }
    // ByteArray is immutable
    clone(value) {
        return value;
    }
    equals(a, b) {
        return byteArray_1.byteArrayEquals(a, b);
    }
}
exports.ByteArrayType = ByteArrayType;
function getChunkBytes(data, merkleBytesBuffer) {
    if (data.length > merkleBytesBuffer.length) {
        throw new Error(`data length ${data.length} exceeds merkleBytesBuffer length ${merkleBytesBuffer.length}`);
    }
    merkleBytesBuffer.set(data);
    const valueLen = data.length;
    const chunkByteLen = Math.ceil(valueLen / 64) * 64;
    // all padding bytes must be zero, this is similar to set zeroHash(0)
    merkleBytesBuffer.subarray(valueLen, chunkByteLen).fill(0);
    return merkleBytesBuffer.subarray(0, chunkByteLen);
}
exports.getChunkBytes = getChunkBytes;
//# sourceMappingURL=byteArray.js.map