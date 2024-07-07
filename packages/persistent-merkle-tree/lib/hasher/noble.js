"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasher = void 0;
const sha256_1 = require("@noble/hashes/sha256");
const as_sha256_1 = require("@chainsafe/as-sha256");
const util_1 = require("./util");
const digest64 = (a, b) => sha256_1.sha256.create().update(a).update(b).digest();
exports.hasher = {
    name: "noble",
    digest64,
    digest64HashObjects: (left, right, parent) => {
        as_sha256_1.byteArrayIntoHashObject(digest64(util_1.hashObjectToUint8Array(left), util_1.hashObjectToUint8Array(right)), 0, parent);
    },
    merkleizeInto() {
        throw new Error("Not implemented");
    },
    digestNLevel() {
        throw new Error("Not implemented");
    },
    executeHashComputations: (hashComputations) => {
        for (let level = hashComputations.length - 1; level >= 0; level--) {
            const hcArr = hashComputations[level];
            if (!hcArr) {
                // should not happen
                throw Error(`no hash computations for level ${level}`);
            }
            for (const hc of hcArr) {
                hc.dest.applyHash(as_sha256_1.digest64HashObjects(hc.src0, hc.src1));
            }
        }
    },
};
//# sourceMappingURL=noble.js.map