/* eslint-disable @typescript-eslint/no-explicit-any */
import cytoscape, { Core } from "cytoscape";
// @ts-ignore - no types available
import nodeHtmlLabel from "cytoscape-node-html-label";
import { getCytoscapeStyles } from "./styles";
import { Level } from "./levels";
import { createInputNode, createOutputNode, CompNode } from "./nodes";
import { ProgramCounter } from "./program_counter";

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

export class GraphEditorContext implements NodeBuildContext {
  public cy: Core;
  public level: Level;
  public inputNodes: CompNode[] = [];
  public outputNodes: CompNode[] = [];
  public allNodes: CompNode[] = [];
  public nodeIdCounter = 0;

  constructor(level: Level) {
    this.level = level;

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

  private initializeInputOutputNodes(level: Level): void {
    const spacing = 150;
    const startY = 100;

    level.inputs.forEach((inputData: Array<any>, index: number) => {
      const x = 100;
      const y = startY + index * spacing;
      const inputNode = createInputNode(this, x, y, inputData);

      inputNode.node.data("deletable", false);

      this.inputNodes.push(inputNode);
      this.allNodes.push(inputNode);
    });

    // Create output nodes
    level.expectedOutputs.forEach((outputs: Array<any>, index: number) => {
      const x = 700;
      const y = startY + index * spacing;
      const outputNode = createOutputNode(this, x, y, outputs);

      outputNode.node.data("deletable", false);

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
