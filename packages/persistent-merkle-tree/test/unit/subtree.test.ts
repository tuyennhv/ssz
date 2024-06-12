import { expect } from "chai";
import {subtreeFillToContents, LeafNode, getNodesAtDepth, executeHashComputations, BranchNode, Node} from "../../src";

describe("subtreeFillToContents", function () {
  // the hash computation takes time
  this.timeout(5000);

  it("Simple case", () => {
    function nodeNum(num: number): LeafNode {
      return LeafNode.fromUint32(num);
    }
    const nodes = [nodeNum(1), nodeNum(2), nodeNum(3), nodeNum(4)];
    subtreeFillToContents(nodes, 2);
  });

  it("should not error on contents length 1", () => {
    subtreeFillToContents([LeafNode.fromZero()], 1);
  });

  it("should not error on empty contents", () => {
    subtreeFillToContents([], 0);
    subtreeFillToContents([], 1);
  });

  it("should not error on depth 31", () => {
    subtreeFillToContents([], 31);
  });

  for (let depth = 1; depth <= 32; depth *= 2) {
    const maxIndex = Math.min(2 ** depth, 200_000);

    for (let count = 1; count <= maxIndex; count *= 2) {
      it(`subtreeFillToContents depth ${depth} count ${count}`, () => {
        const nodes = new Array<LeafNode>(count);
        const expectedNodes = new Array<LeafNode>(count);
        for (let i = 0; i < count; i++) {
          const node = LeafNode.fromZero();
          nodes[i] = node;
          expectedNodes[i] = node;
        }

        const hashComps = {
          offset: 0,
          byLevel: [],
        };

        const node = subtreeFillToContents(nodes, depth, hashComps);
        const retrievedNodes = getNodesAtDepth(node, depth, 0, count);

        // Assert correct
        for (let i = 0; i < count; i++) {
          if (retrievedNodes[i] !== expectedNodes[i]) {
            throw Error(`Wrong node at index ${i}`);
          }
        }
        executeHashComputations(hashComps.byLevel);
        if (node.h0 === null) {
          throw Error("Root node h0 is null");
        }
      });
    }
  }
});

describe("subtreeFillToContents - validator nodes", function () {
  /**
   * 0                                                root
   *                               /                                         \
   * 1                        10                                                11
   *                   /                 \                                 /             \
   * 2            20                          21                     22                    23
   *           /       \                  /       \             /       \             /         \
   * 3      pub         with         eff         sla        act         act         exit        with
   *      /     \
   * 4 pub0      pub1
   **/
  it("should compute HashComputations for validator nodes", () => {
    const numNodes = 8;
    const nodesArr: Array<Node[]> = [];
    for (let count = 0; count < 2; count++) {
      const nodes = new Array<Node>(numNodes);
      for (let i = 1; i < numNodes; i++) {
        const node = LeafNode.fromUint32(i);
        nodes[i] = node;
      }
      nodes[0] = new BranchNode(LeafNode.fromUint32(0), LeafNode.fromUint32(1));
      nodesArr.push(nodes);
    }

    // maxChunksToDepth in ssz returns 3 for 8 nodes
    const depth = 3;
    const root0 = subtreeFillToContents(nodesArr[0], depth);
    const hashComps = {
      offset: 0,
      byLevel: new Array<[]>(),
    };
    const node = subtreeFillToContents(nodesArr[1], depth, hashComps);
    expect(hashComps.byLevel.length).to.equal(4);
    expect(hashComps.byLevel[0].length).to.equal(1);
    expect(hashComps.byLevel[1].length).to.equal(2);
    expect(hashComps.byLevel[2].length).to.equal(4);
    expect(hashComps.byLevel[3].length).to.equal(1);
    executeHashComputations(hashComps.byLevel);
    if (node.h0 === null) {
      throw Error("Root node h0 is null");
    }
    expect(node.root).to.deep.equal(root0.root);
  });
});
