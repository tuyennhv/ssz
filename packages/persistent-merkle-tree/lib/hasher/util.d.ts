import { HashObject } from "@chainsafe/as-sha256/lib/hashObject";
export declare function hashObjectToUint8Array(obj: HashObject): Uint8Array;
export declare function uint8ArrayToHashObject(byteArr: Uint8Array): HashObject;
declare type HashIntoFn = (input: Uint8Array, output: Uint8Array) => void;
/**
 * Input data is unsafe because it's modified
 * If its chunk count is not even, need to be appended with zero hash at layer 0 so that we don't need
 * a new memory allocation here (even through we don't need it if padFor = 1)
 * The Uint8Array(32) will be written to output at offset
 */
export declare function doMerkleizeInto(data: Uint8Array, padFor: number, output: Uint8Array, offset: number, hashInto: HashIntoFn): void;
/**
 * Input data is unsafe because it's modified
 * given nLevel = 3
 * digest multiple of 8 chunks = 256 bytes
 * the result is multiple of 1 chunk = 32 bytes
 * this is the same to hashTreeRoot() of multiple validators
 */
export declare function doDigestNLevel(data: Uint8Array, nLevel: number, hashInto: HashIntoFn): Uint8Array;
export {};
