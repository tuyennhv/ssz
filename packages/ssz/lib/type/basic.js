"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isBasicType = exports.BasicType = void 0;
const abstract_1 = require("./abstract");
/* eslint-disable @typescript-eslint/member-ordering */
/**
 * Represents a basic type as defined in the spec:
 * https://github.com/ethereum/consensus-specs/blob/dev/ssz/simple-serialize.md#basic-types
 */
class BasicType extends abstract_1.Type {
    constructor() {
        super(...arguments);
        this.isBasic = true;
        // Basic types merkleize to exactly one chunk, thus depth of 0
        this.depth = 0;
        // Basic types merkleize to exactly one chunk
        this.maxChunkCount = 1;
    }
    value_serializedSize() {
        return this.byteLength;
    }
    tree_serializedSize() {
        return this.byteLength;
    }
    assertValidSize(size) {
        if (size !== this.byteLength) {
            throw Error(`BasicType invalid size ${size} expected ${this.byteLength}`);
        }
    }
    hashTreeRoot(value) {
        const root = new Uint8Array(32);
        this.hashTreeRootInto(value, root, 0);
        return root;
    }
    hashTreeRootInto(value, output, offset) {
        const uint8Array = output.subarray(offset, offset + 32);
        // output could have preallocated data, some types may not fill the whole 32 bytes
        uint8Array.fill(0);
        const dataView = new DataView(uint8Array.buffer, uint8Array.byteOffset, uint8Array.byteLength);
        this.value_serializeToBytes({ uint8Array, dataView }, 0, value);
    }
    clone(value) {
        // All basic types are represented by primitive Javascript types, don't require clone
        return value;
    }
    equals(a, b) {
        // All basic types are represented by primitive Javascript types, the operator === is sufficient
        return a === b;
    }
}
exports.BasicType = BasicType;
function isBasicType(type) {
    return type.isBasic;
}
exports.isBasicType = isBasicType;
//# sourceMappingURL=basic.js.map