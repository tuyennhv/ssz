"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TreeViewDU = void 0;
const persistent_merkle_tree_1 = require("@chainsafe/persistent-merkle-tree");
const abstract_1 = require("../view/abstract");
/**
 * Always allocating a new HashComputationGroup for each hashTreeRoot() is not great for gc
 * because a lot of ViewDUs are not changed and computed root already.
 */
let nextHashComps = {
    byLevel: [],
    offset: 0,
};
const symbolCachedTreeRoot = Symbol("ssz_cached_tree_root");
/* eslint-disable @typescript-eslint/member-ordering  */
/**
 * A Deferred Update Tree View (`ViewDU`) is a wrapper around a type and
 * a SSZ Node that contains:
 * - data merkleized
 * - some arbitrary caches to speed up data manipulation required by the type
 *
 * **ViewDU**
 * - Best for complex usage where performance is important
 * - Defers changes to when commit is called
 * - Does NOT have a reference to the parent ViewDU
 * - Has caches for fast get / set ops
 */
class TreeViewDU extends abstract_1.TreeView {
    /*
     * By default use type to serialize ViewDU.
     */
    serializeToBytes(output, offset) {
        return this.type.tree_serializeToBytes(output, offset, this.node);
    }
    /**
     * Merkleize view and compute its hashTreeRoot.
     * Commits any pending changes before computing the root.
     *
     * See spec for definition of hashTreeRoot:
     * https://github.com/ethereum/consensus-specs/blob/dev/ssz/simple-serialize.md#merkleization
     */
    hashTreeRoot() {
        // remember not to do a commit() before calling this function
        // in ethereum consensus, the only type goes with TVDU is BeaconState and it's really more efficient to hash the tree in batch
        // if consumers don't want to batch hash, just go with `this.node.root` similar to what View.hashTreeRoot() does
        const hashComps = nextHashComps;
        this.commit(hashComps);
        if (nextHashComps.byLevel.length > 0 || nextHashComps.offset !== 0) {
            // preallocate for the next time
            nextHashComps = {
                byLevel: [],
                offset: 0,
            };
            persistent_merkle_tree_1.executeHashComputations(hashComps.byLevel);
            // This makes sure the root node is computed by batch
            if (this.node.h0 === null) {
                throw Error("Root is not computed by batch");
            }
        }
        const cachedRoot = this.node[symbolCachedTreeRoot];
        if (cachedRoot) {
            return cachedRoot;
        }
        else {
            const root = this.node.root;
            this.node[symbolCachedTreeRoot] = root;
            return root;
        }
    }
    /**
     * Serialize view to binary data.
     * Commits any pending changes before computing the root.
     * Warning: this calls commit() which evict all pending HashComputations. Consider calling hashTreeRoot() before this
     */
    serialize() {
        this.commit();
        const output = new Uint8Array(this.type.tree_serializedSize(this.node));
        const dataView = new DataView(output.buffer, output.byteOffset, output.byteLength);
        this.serializeToBytes({ uint8Array: output, dataView }, 0);
        return output;
    }
    /**
     * Return a new ViewDU instance referencing the same internal `Node`.
     *
     * By default it will transfer the cache of this ViewDU to the new cloned instance. Set `dontTransferCache` to true
     * to NOT transfer the cache to the cloned instance.
     */
    clone(dontTransferCache) {
        if (dontTransferCache) {
            return this.type.getViewDU(this.node);
        }
        else {
            const cache = this.cache;
            this.clearCache();
            return this.type.getViewDU(this.node, cache);
        }
    }
}
exports.TreeViewDU = TreeViewDU;
//# sourceMappingURL=abstract.js.map