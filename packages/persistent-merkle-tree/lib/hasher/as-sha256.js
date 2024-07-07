"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasher = void 0;
const as_sha256_1 = require("@chainsafe/as-sha256");
const util_1 = require("./util");
exports.hasher = {
    name: "as-sha256",
    digest64: as_sha256_1.digest2Bytes32,
    digest64HashObjects: as_sha256_1.digest64HashObjectsInto,
    merkleizeInto(data, padFor, output, offset) {
        return util_1.doMerkleizeInto(data, padFor, output, offset, as_sha256_1.hashInto);
    },
    digestNLevel(data, nLevel) {
        return util_1.doDigestNLevel(data, nLevel, as_sha256_1.hashInto);
    },
    executeHashComputations: (hashComputations) => {
        for (let level = hashComputations.length - 1; level >= 0; level--) {
            const hcArr = hashComputations[level];
            if (!hcArr) {
                // should not happen
                throw Error(`no hash computations for level ${level}`);
            }
            if (hcArr.length === 0) {
                // nothing to hash
                continue;
            }
            // HashComputations of the same level are safe to batch
            let src0_0 = null;
            let src1_0 = null;
            let dest0 = null;
            let src0_1 = null;
            let src1_1 = null;
            let dest1 = null;
            let src0_2 = null;
            let src1_2 = null;
            let dest2 = null;
            let src0_3 = null;
            let src1_3 = null;
            let dest3 = null;
            for (const [i, hc] of hcArr.entries()) {
                const indexInBatch = i % 4;
                switch (indexInBatch) {
                    case 0:
                        src0_0 = hc.src0;
                        src1_0 = hc.src1;
                        dest0 = hc.dest;
                        break;
                    case 1:
                        src0_1 = hc.src0;
                        src1_1 = hc.src1;
                        dest1 = hc.dest;
                        break;
                    case 2:
                        src0_2 = hc.src0;
                        src1_2 = hc.src1;
                        dest2 = hc.dest;
                        break;
                    case 3:
                        src0_3 = hc.src0;
                        src1_3 = hc.src1;
                        dest3 = hc.dest;
                        if (src0_0 !== null &&
                            src1_0 !== null &&
                            dest0 !== null &&
                            src0_1 !== null &&
                            src1_1 !== null &&
                            dest1 !== null &&
                            src0_2 !== null &&
                            src1_2 !== null &&
                            dest2 !== null &&
                            src0_3 !== null &&
                            src1_3 !== null &&
                            dest3 !== null) {
                            // TODO - batch: find a way not allocate here
                            const [o0, o1, o2, o3] = as_sha256_1.batchHash4HashObjectInputs([
                                src0_0,
                                src1_0,
                                src0_1,
                                src1_1,
                                src0_2,
                                src1_2,
                                src0_3,
                                src1_3,
                            ]);
                            if (o0 == null || o1 == null || o2 == null || o3 == null) {
                                throw Error(`batchHash4HashObjectInputs return null or undefined at batch ${i} level ${level}`);
                            }
                            dest0.applyHash(o0);
                            dest1.applyHash(o1);
                            dest2.applyHash(o2);
                            dest3.applyHash(o3);
                            // reset for next batch
                            src0_0 = null;
                            src1_0 = null;
                            dest0 = null;
                            src0_1 = null;
                            src1_1 = null;
                            dest1 = null;
                            src0_2 = null;
                            src1_2 = null;
                            dest2 = null;
                            src0_3 = null;
                            src1_3 = null;
                            dest3 = null;
                        }
                        break;
                    default:
                        throw Error(`Unexpected indexInBatch ${indexInBatch}`);
                }
            }
            // remaining
            if (src0_0 !== null && src1_0 !== null && dest0 !== null) {
                dest0.applyHash(as_sha256_1.digest64HashObjects(src0_0, src1_0));
            }
            if (src0_1 !== null && src1_1 !== null && dest1 !== null) {
                dest1.applyHash(as_sha256_1.digest64HashObjects(src0_1, src1_1));
            }
            if (src0_2 !== null && src1_2 !== null && dest2 !== null) {
                dest2.applyHash(as_sha256_1.digest64HashObjects(src0_2, src1_2));
            }
            if (src0_3 !== null && src1_3 !== null && dest3 !== null) {
                dest3.applyHash(as_sha256_1.digest64HashObjects(src0_3, src1_3));
            }
        }
    },
};
//# sourceMappingURL=as-sha256.js.map