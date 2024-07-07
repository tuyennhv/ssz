import { Node } from "@chainsafe/persistent-merkle-tree";
import { Type } from "../type/abstract";
import { BranchNodeStruct } from "../branchNodeStruct";
import { ContainerTypeGeneric, ValueOfFields } from "../view/container";
import { ContainerTreeViewDUTypeConstructor } from "./container";
import { TreeViewDU } from "./abstract";
export declare class ContainerNodeStructTreeViewDU<Fields extends Record<string, Type<unknown>>> extends TreeViewDU<ContainerTypeGeneric<Fields>> {
    readonly type: ContainerTypeGeneric<Fields>;
    protected valueChanged: ValueOfFields<Fields> | null;
    protected _rootNode: BranchNodeStruct<ValueOfFields<Fields>>;
    constructor(type: ContainerTypeGeneric<Fields>, node: Node);
    get node(): Node;
    get cache(): void;
    get value(): ValueOfFields<Fields>;
    /**
     * This ViewDU does not support batch hash by default so we need to compute root immediately.
     * Otherwise consumers may call commit() multiple times and not able to compute hashTreeRoot().
     */
    commit(): void;
    /**
     * Same to commit() without hash, allow to do the batch hash at consumer side, like in ListValidatorViewDU
     * of ethereum consensus node.
     */
    commitNoHash(): void;
    protected clearCache(): void;
}
export declare function getContainerTreeViewDUClass<Fields extends Record<string, Type<unknown>>>(type: ContainerTypeGeneric<Fields>): ContainerTreeViewDUTypeConstructor<Fields>;
//# sourceMappingURL=containerNodeStruct.d.ts.map