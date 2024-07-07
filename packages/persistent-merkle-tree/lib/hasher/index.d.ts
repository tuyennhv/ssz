import { Hasher } from "./types";
export * from "./types";
export * from "./util";
/**
 * Default hasher used across the SSZ codebase, this does not support batch hash.
 * Use `as-sha256` hasher for batch hashing using SIMD.
 * TODO - batch: Use `hashtree` hasher for 20x speedup
 */
export declare let hasher: Hasher;
/**
 * Set the hasher to be used across the SSZ codebase
 *
 * WARNING: This function is intended for power users and must be executed before any other SSZ code is imported
 */
export declare function setHasher(newHasher: Hasher): void;
export declare function digest64(a: Uint8Array, b: Uint8Array): Uint8Array;
export declare function digestNLevel(data: Uint8Array, nLevel: number): Uint8Array;
export declare function merkleizeInto(data: Uint8Array, padFor: number, output: Uint8Array, offset: number): void;
