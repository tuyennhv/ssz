"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.zeroNode = void 0;
const node_1 = require("./node");
const zeroes = [node_1.LeafNode.fromZero()];
/**
 * Return the `Node` at a specified height from the merkle tree made of "zero data"
 * ```
 *           ...
 *          /
 *         x           <- height 2
 *      /     \
 *     x       x       <- height 1
 *   /  \      /  \
 * 0x0  0x0  0x0  0x0  <- height 0
 * ```
 */
function zeroNode(height) {
    if (height >= zeroes.length) {
        for (let i = zeroes.length; i <= height; i++) {
            zeroes[i] = new node_1.BranchNode(zeroes[i - 1], zeroes[i - 1]);
        }
        // make sure hash is precomputed in order not to put zeroNodes to HashComputation
        // otherwise get OOM
        zeroes[height].root;
    }
    return zeroes[height];
}
exports.zeroNode = zeroNode;
//# sourceMappingURL=zeroNode.js.map