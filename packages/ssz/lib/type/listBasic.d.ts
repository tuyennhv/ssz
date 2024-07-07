/// <reference types="node" />
import { HashComputationGroup, Node, Tree } from "@chainsafe/persistent-merkle-tree";
import { ValueOf } from "./abstract";
import { BasicType } from "./basic";
import { ByteViews } from "./composite";
import { Require } from "../util/types";
import { ArrayBasicType } from "../view/arrayBasic";
import { ListBasicTreeView } from "../view/listBasic";
import { ListBasicTreeViewDU } from "../viewDU/listBasic";
import { ArrayType } from "./array";
export interface ListBasicOpts {
    typeName?: string;
    cachePermanentRootStruct?: boolean;
}
/**
 * List: ordered variable-length homogeneous collection, limited to N values
 *
 * Array of Basic type:
 * - Basic types are max 32 bytes long so multiple values may be packed in the same node.
 * - Basic types are never returned in a view wrapper, but their value representation
 */
export declare class ListBasicType<ElementType extends BasicType<unknown>> extends ArrayType<ElementType, ListBasicTreeView<ElementType>, ListBasicTreeViewDU<ElementType>> implements ArrayBasicType<ElementType> {
    readonly elementType: ElementType;
    readonly limit: number;
    readonly typeName: string;
    readonly itemsPerChunk: number;
    readonly depth: number;
    readonly chunkDepth: number;
    readonly maxChunkCount: number;
    readonly fixedSize: null;
    readonly minSize: number;
    readonly maxSize: number;
    readonly isList = true;
    readonly isViewMutable = true;
    readonly mixInLengthChunkBytes: Uint8Array;
    readonly mixInLengthBuffer: Buffer;
    protected readonly defaultLen = 0;
    constructor(elementType: ElementType, limit: number, opts?: ListBasicOpts);
    static named<ElementType extends BasicType<unknown>>(elementType: ElementType, limit: number, opts: Require<ListBasicOpts, "typeName">): ListBasicType<ElementType>;
    getView(tree: Tree): ListBasicTreeView<ElementType>;
    getViewDU(node: Node, cache?: unknown): ListBasicTreeViewDU<ElementType>;
    commitView(view: ListBasicTreeView<ElementType>): Node;
    commitViewDU(view: ListBasicTreeViewDU<ElementType>, hashComps?: HashComputationGroup | null): Node;
    cacheOfViewDU(view: ListBasicTreeViewDU<ElementType>): unknown;
    value_serializedSize(value: ValueOf<ElementType>[]): number;
    value_serializeToBytes(output: ByteViews, offset: number, value: ValueOf<ElementType>[]): number;
    value_deserializeFromBytes(data: ByteViews, start: number, end: number): ValueOf<ElementType>[];
    tree_serializedSize(node: Node): number;
    tree_serializeToBytes(output: ByteViews, offset: number, node: Node): number;
    tree_deserializeFromBytes(data: ByteViews, start: number, end: number): Node;
    tree_getLength(node: Node): number;
    tree_setLength(tree: Tree, length: number): void;
    tree_getChunksNode(node: Node): Node;
    tree_chunksNodeOffset(): number;
    tree_setChunksNode(rootNode: Node, chunksNode: Node, newLength: number | null, hashComps: HashComputationGroup | null): Node;
    hashTreeRoot(value: ValueOf<ElementType>[]): Uint8Array;
    hashTreeRootInto(value: ValueOf<ElementType>[], output: Uint8Array, offset: number): void;
    protected getChunkBytes(value: ValueOf<ElementType>[]): Uint8Array;
}
//# sourceMappingURL=listBasic.d.ts.map