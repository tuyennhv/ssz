import {sha256} from "@noble/hashes/sha256";
import {digest64HashObjects, HashObject} from "@chainsafe/as-sha256";
import type {Hasher} from "./types";
import {hashObjectToUint8Array, uint8ArrayToHashObject} from "./util";

const digest64 = (a: Uint8Array, b: Uint8Array): Uint8Array => sha256.create().update(a).update(b).digest();

export const hasher: Hasher = {
  digest64,
  digest64HashObjects: (a, b) => uint8ArrayToHashObject(digest64(hashObjectToUint8Array(a), hashObjectToUint8Array(b))),
  batchHashObjects: (inputs: HashObject[]) => {
    // noble does not support batch hash
    if (inputs.length === 0) {
      return [];
    } else if (inputs.length % 2 !== 0) {
      throw new Error(`Expect inputs.length to be even, got ${inputs.length}`);
    }

    const outputs = new Array<HashObject>();
    for (let i = 0; i < inputs.length; i += 2) {
      const output = digest64HashObjects(inputs[i], inputs[i + 1]);
      outputs.push(output);
    }
    return outputs;
  },
};
