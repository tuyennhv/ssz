import { Node } from "@chainsafe/persistent-merkle-tree";
import { ByteViews, ValueOf } from "../type/abstract";
import { CompositeType, CompositeView, CompositeViewDU } from "../type/composite";
import { ListCompositeType } from "../view/listComposite";
import { ArrayCompositeTreeViewDU, ArrayCompositeTreeViewDUCache } from "./arrayComposite";
export declare class ListCompositeTreeViewDU<ElementType extends CompositeType<ValueOf<ElementType>, CompositeView<ElementType>, CompositeViewDU<ElementType>>> extends ArrayCompositeTreeViewDU<ElementType> {
    readonly type: ListCompositeType<ElementType>;
    protected _rootNode: Node;
    constructor(type: ListCompositeType<ElementType>, _rootNode: Node, cache?: ArrayCompositeTreeViewDUCache);
    /**
     * Adds one value element at the end of the array and adds 1 to the un-commited ViewDU length
     */
    push(view: CompositeViewDU<ElementType>): void;
    /**
     * Returns a new ListCompositeTreeViewDU instance with the values from 0 to `index`.
     * The new list is equivalent to (pseudo-code):
     *
     * ```ts
     * const nodes = getChunkNodes()
     * return listFromChunkNodes(nodes.slice(0, index + 1))
     * ```
     *
     * To achieve it, rebinds the underlying tree zero-ing all nodes right of `index`.
     *
     * Note: Using index = -1, returns an empty list of length 0.
     */
    sliceTo(index: number): this;
    /**
     * Returns a new ListCompositeTreeViewDU instance with the values from `index` to the end of list
     *
     * ```ts
     * const nodes = getChunkNodes()
     * return listFromChunkNodes(node.slice(index))
     * ```
     *
     * Note: If index === n, returns an empty list of length 0
     *
     */
    sliceFrom(index: number): this;
    /**
     * Same method to `type/listComposite.ts` leveraging cached nodes.
     */
    serializeToBytes(output: ByteViews, offset: number): number;
}
//# sourceMappingURL=listComposite.d.ts.map