"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.doDigestNLevel = exports.doMerkleizeInto = exports.uint8ArrayToHashObject = exports.hashObjectToUint8Array = void 0;
const hashObject_1 = require("@chainsafe/as-sha256/lib/hashObject");
const zeroHash_1 = require("../zeroHash");
function hashObjectToUint8Array(obj) {
    const byteArr = new Uint8Array(32);
    hashObject_1.hashObjectToByteArray(obj, byteArr, 0);
    return byteArr;
}
exports.hashObjectToUint8Array = hashObjectToUint8Array;
function uint8ArrayToHashObject(byteArr) {
    return hashObject_1.byteArrayToHashObject(byteArr, 0);
}
exports.uint8ArrayToHashObject = uint8ArrayToHashObject;
/**
 * Input data is unsafe because it's modified
 * If its chunk count is not even, need to be appended with zero hash at layer 0 so that we don't need
 * a new memory allocation here (even through we don't need it if padFor = 1)
 * The Uint8Array(32) will be written to output at offset
 */
function doMerkleizeInto(data, padFor, output, offset, hashInto) {
    if (padFor < 1) {
        throw new Error(`Invalid padFor, expect to be greater than 0, got ${padFor}`);
    }
    const layerCount = Math.ceil(Math.log2(padFor));
    if (data.length === 0) {
        output.set(zeroHash_1.zeroHash(layerCount), offset);
        return;
    }
    if (data.length % 32 !== 0) {
        throw new Error(`Invalid input length, expect to be multiple of 32 bytes, got ${data.length}`);
    }
    // if padFor = 1, only need 32 bytes
    if (padFor > 1 && data.length % 64 !== 0) {
        throw new Error(`Invalid input length, expect to be multiple of 64 bytes, got ${data.length}, padFor=${padFor}`);
    }
    let inputLength = data.length;
    let outputLength = Math.floor(inputLength / 2);
    let bufferIn = data;
    // hash into the same buffer
    for (let i = 0; i < layerCount; i++) {
        const bufferOut = data.subarray(0, outputLength);
        hashInto(bufferIn, bufferOut);
        const chunkCount = Math.floor(outputLength / 32);
        if (chunkCount % 2 === 1 && i < layerCount - 1) {
            // extend to 1 more chunk
            inputLength = outputLength + 32;
            bufferIn = data.subarray(0, inputLength);
            bufferIn.set(zeroHash_1.zeroHash(i + 1), outputLength);
        }
        else {
            bufferIn = bufferOut;
            inputLength = outputLength;
        }
        outputLength = Math.floor(inputLength / 2);
    }
    output.set(bufferIn.subarray(0, 32), offset);
}
exports.doMerkleizeInto = doMerkleizeInto;
/**
 * Input data is unsafe because it's modified
 * given nLevel = 3
 * digest multiple of 8 chunks = 256 bytes
 * the result is multiple of 1 chunk = 32 bytes
 * this is the same to hashTreeRoot() of multiple validators
 */
function doDigestNLevel(data, nLevel, hashInto) {
    let inputLength = data.length;
    const bytesInBatch = Math.pow(2, nLevel) * 32;
    if (nLevel < 1) {
        throw new Error(`Invalid nLevel, expect to be greater than 0, got ${nLevel}`);
    }
    if (inputLength % bytesInBatch !== 0) {
        throw new Error(`Invalid input length, expect to be multiple of ${bytesInBatch} for nLevel ${nLevel}, got ${inputLength}`);
    }
    let outputLength = Math.floor(inputLength / 2);
    // hash into same buffer
    let bufferIn = data;
    for (let i = nLevel; i > 0; i--) {
        const bufferOut = bufferIn.subarray(0, outputLength);
        hashInto(bufferIn, bufferOut);
        bufferIn = bufferOut;
        inputLength = outputLength;
        outputLength = Math.floor(inputLength / 2);
    }
    return bufferIn;
}
exports.doDigestNLevel = doDigestNLevel;
//# sourceMappingURL=util.js.map