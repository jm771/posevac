import cytoscape, { Core, NodeSingular } from "cytoscape";
// @ts-ignore - no types available
import nodeHtmlLabel from "cytoscape-node-html-label";
import { getCytoscapeStyles } from "./styles";
import { Level } from "./levels";
import { createInputNode, createOutputNode, CompNode } from "./nodes";
import { ProgramCounter } from "./program_counter";
import { Assert } from "./util";

// Register the node-html-label extension
if (typeof cytoscape !== "undefined") {
  nodeHtmlLabel(cytoscape);
}

export enum Stage {
  AdvanceCounter = 1,
  Evaluate,
}

export class AnimationState {
  programCounters: Map<string, ProgramCounter>;
  isAnimating: boolean;
  stage: Stage;
  nodeAnimationState: Map<string, any>;

  constructor(nodes: Array<CompNode>) {
    this.programCounters = new Map<string, ProgramCounter>();
    this.isAnimating = false;
    this.stage = Stage.Evaluate;
    this.nodeAnimationState = new Map<string, any>();
    nodes.forEach((n: CompNode) => {
      this.nodeAnimationState.set(n.getNodeId(), n.makeCleanState());
    });
  }

  destroy() {
    this.programCounters.forEach((pc) => pc.destroy());
  }
}

export interface NodeBuildContext {
  cy: Core;
  nodeIdCounter: number;
}

let i = 0;

export class GraphEditorContext implements NodeBuildContext {
  public cy: Core;
  public level: Level;
  public inputNodes: CompNode[] = [];
  public outputNodes: CompNode[] = [];
  public allNodes: CompNode[] = [];
  public nodeIdCounter = 0;
  id: number;

  constructor(level: Level) {
    console.log("editor context being constructed");

    this.level = level;
    this.id = i++;

    const container = document.getElementById("cy");
    if (!container) {
      throw new Error("Cytoscape container element not found");
    }

    this.cy = cytoscape({
      container: container,
      style: getCytoscapeStyles(),
      // layout: {
      //   name: "preset",
      // },
      minZoom: 0.5,
      maxZoom: 2,
      autoungrabify: false,
      userPanningEnabled: true,
      userZoomingEnabled: true,
      boxSelectionEnabled: false,
    });

    this.initializeInputOutputNodes(level);
  }

  private getNodeIndexForNodeId(nodeId: string): number {
    const nodeIndex = this.allNodes.findIndex((n) => n.getNodeId() === nodeId);

    // Assert(
    //   nodeIndex !== -1,
    //   `could not find node for id ${nodeId}. MyId=${
    //     this.id
    //   } Available were ${this.allNodes.map((x) => x.getNodeId())}`
    // );
    return nodeIndex;
  }

  private getNodeIndexForNode(node: NodeSingular): number {
    // while (node.isChild()) {
    //   node = node.parent() as NodeSingular;
    // }

    return this.getNodeIndexForNodeId(node.id());
  }

  getCompNodeForNode(node: NodeSingular): CompNode | null {
    const idx = this.getNodeIndexForNode(node);
    return idx === -1 ? null : this.allNodes[idx];
  }

  removeNode(nodeId: string) {
    const idx = this.getNodeIndexForNodeId(nodeId);
    Assert(idx !== -1, `node ${nodeId} not found for delete`);

    this.allNodes[idx].destroy();
    this.allNodes.splice(idx, 1);
  }

  private initializeInputOutputNodes(level: Level): void {
    const spacing = 150;
    const startY = 100;

    level.inputs.forEach((inputData: Array<any>, index: number) => {
      const x = 100;
      const y = startY + index * spacing;
      const inputNode = createInputNode(this, x, y, inputData);

      this.inputNodes.push(inputNode);
      this.allNodes.push(inputNode);
    });

    // Create output nodes
    level.expectedOutputs.forEach((outputs: Array<any>, index: number) => {
      const x = 700;
      const y = startY + index * spacing;
      const outputNode = createOutputNode(this, x, y, outputs);

      this.outputNodes.push(outputNode);
      this.allNodes.push(outputNode);
    });
  }

  destroy(): void {
    if (this.cy) {
      this.cy.destroy();
    }
  }
}

export class LevelContext {
  editorContext: GraphEditorContext;
  animationState: AnimationState | null;
  constructor(
    editorContex: GraphEditorContext,
    animationState: AnimationState | null
  ) {
    this.editorContext = editorContex;
    this.animationState = animationState;
  }

  destroy(): void {
    this.animationState?.destroy();
    this.editorContext.destroy();
  }
}
