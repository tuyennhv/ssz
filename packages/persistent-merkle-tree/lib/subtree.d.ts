import { HashComputationGroup, Node } from "./node";
export declare function subtreeFillToDepth(bottom: Node, depth: number): Node;
export declare function subtreeFillToLength(bottom: Node, depth: number, length: number): Node;
/**
 * WARNING: Mutates the provided nodes array.
 * @param hashCompRootNode is a hacky way from ssz to set `dest` of HashComputation for BranchNodeStruct
 * TODO: Don't mutate the nodes array.
 * TODO - batch: check consumers of this function, can we compute HashComputationGroup when deserializing ViewDU from Uint8Array?
 */
export declare function subtreeFillToContents(nodes: Node[], depth: number, hashComps?: HashComputationGroup | null, hashCompRootNode?: Node | null): Node;
