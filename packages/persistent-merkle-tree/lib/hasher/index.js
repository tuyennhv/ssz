"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.merkleizeInto = exports.digestNLevel = exports.digest64 = exports.setHasher = exports.hasher = void 0;
// import {hasher as nobleHasher} from "./noble";
// import {hasher as csHasher} from "./as-sha256";
const hashtree_1 = require("./hashtree");
__exportStar(require("./types"), exports);
__exportStar(require("./util"), exports);
/**
 * Default hasher used across the SSZ codebase, this does not support batch hash.
 * Use `as-sha256` hasher for batch hashing using SIMD.
 * TODO - batch: Use `hashtree` hasher for 20x speedup
 */
// export let hasher: Hasher = nobleHasher;
// For testing purposes, we use the as-sha256 hasher
// export let hasher: Hasher = csHasher;
// For testing purposes, we use the hashtree hasher
exports.hasher = hashtree_1.hasher;
/**
 * Set the hasher to be used across the SSZ codebase
 *
 * WARNING: This function is intended for power users and must be executed before any other SSZ code is imported
 */
function setHasher(newHasher) {
    exports.hasher = newHasher;
}
exports.setHasher = setHasher;
function digest64(a, b) {
    return exports.hasher.digest64(a, b);
}
exports.digest64 = digest64;
function digestNLevel(data, nLevel) {
    return exports.hasher.digestNLevel(data, nLevel);
}
exports.digestNLevel = digestNLevel;
function merkleizeInto(data, padFor, output, offset) {
    exports.hasher.merkleizeInto(data, padFor, output, offset);
}
exports.merkleizeInto = merkleizeInto;
//# sourceMappingURL=index.js.map