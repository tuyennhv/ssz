"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListBasicTreeViewDU = void 0;
const persistent_merkle_tree_1 = require("@chainsafe/persistent-merkle-tree");
const arrayBasic_1 = require("./arrayBasic");
const arrayBasic_2 = require("../type/arrayBasic");
class ListBasicTreeViewDU extends arrayBasic_1.ArrayBasicTreeViewDU {
    constructor(type, _rootNode, cache) {
        super(type, _rootNode, cache);
        this.type = type;
        this._rootNode = _rootNode;
    }
    /**
     * Adds one value element at the end of the array and adds 1 to the un-commited ViewDU length
     */
    push(value) {
        if (this._length >= this.type.limit) {
            throw Error("Error pushing over limit");
        }
        // Mutate length before .set()
        this.dirtyLength = true;
        const index = this._length++;
        // If in new node..
        if (index % this.type.itemsPerChunk === 0) {
            // Set a zero node to the nodes array to avoid a navigation downwards in .set()
            const chunkIndex = Math.floor(index / this.type.itemsPerChunk);
            this.nodes[chunkIndex] = persistent_merkle_tree_1.zeroNode(0);
        }
        this.set(index, value);
    }
    /**
     * Returns a new ListBasicTreeViewDU instance with the values from 0 to `index`.
     * To achieve it, rebinds the underlying tree zero-ing all nodes right of `chunkIindex`.
     * Also set all value right of `index` in the same chunk to 0.
     */
    sliceTo(index) {
        if (index < 0) {
            throw Error(`Does not support sliceTo() with negative index ${index}`);
        }
        // it's the responsibility of consumer to call commit() before calling this method
        // if we do the commit() here, it'll lose all HashComputations that we want to batch
        if (this.nodesChanged.size > 0) {
            throw Error(`Must commit changes before sliceTo(${index})`);
        }
        // All nodes beyond length are already zero
        if (index >= this._length - 1) {
            return this;
        }
        const rootNode = this._rootNode;
        const chunkIndex = Math.floor(index / this.type.itemsPerChunk);
        const nodePrev = (this.nodes[chunkIndex] ?? persistent_merkle_tree_1.getNodeAtDepth(rootNode, this.type.depth, chunkIndex));
        // we can't set remaining items in the same chunk to 0 with tree_setToPackedNode api due to setBitwiseOR in UintNumberType
        // instead, we set the same value in nodePrev up until index
        const nodeChanged = persistent_merkle_tree_1.LeafNode.fromZero();
        for (let i = chunkIndex * this.type.itemsPerChunk; i <= index; i++) {
            const prevValue = this.type.elementType.tree_getFromPackedNode(nodePrev, i);
            this.type.elementType.tree_setToPackedNode(nodeChanged, i, prevValue);
        }
        const chunksNode = this.type.tree_getChunksNode(this._rootNode);
        let newChunksNode = persistent_merkle_tree_1.setNodesAtDepth(chunksNode, this.type.chunkDepth, [chunkIndex], [nodeChanged]);
        // also do the treeZeroAfterIndex operation on the chunks tree
        newChunksNode = persistent_merkle_tree_1.treeZeroAfterIndex(newChunksNode, this.type.chunkDepth, chunkIndex);
        // Must set new length and commit to tree to restore the same tree at that index
        const newLength = index + 1;
        const newRootNode = this.type.tree_setChunksNode(rootNode, newChunksNode, newLength, null);
        return this.type.getViewDU(newRootNode);
    }
    /**
     * Same method to `type/listBasic.ts` leveraging cached nodes.
     */
    serializeToBytes(output, offset) {
        // it's the responsibility of consumer to call commit() before calling this method
        // if we do the commit() here, it'll lose all HashComputations that we want to batch
        if (this.nodesChanged.size > 0) {
            throw Error(`Must commit changes before serializeToBytes(Uint8Array(${output.uint8Array.length}), ${offset})`);
        }
        const { nodes, nodesPopulated } = this.cache;
        const chunksNode = this.type.tree_getChunksNode(this._rootNode);
        return arrayBasic_2.tree_serializeToBytesArrayBasic(this.type.elementType, this._length, this.type.chunkDepth, output, offset, chunksNode, nodesPopulated ? nodes : null);
    }
}
exports.ListBasicTreeViewDU = ListBasicTreeViewDU;
//# sourceMappingURL=listBasic.js.map