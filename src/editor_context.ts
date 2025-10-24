import cytoscape, { Core, NodeSingular } from "cytoscape";
// @ts-ignore - no types available
import nodeHtmlLabel from "cytoscape-node-html-label";
import { EvaluationListenerHolder, Evaluator } from "./evaluation";
import { Level } from "./levels";
import { CompNode, createInputNode, createOutputNode } from "./nodes";
import { getCytoscapeStyles } from "./styles";
import { Assert } from "./util";

// Register the node-html-label extension
if (typeof cytoscape !== "undefined") {
  nodeHtmlLabel(cytoscape);
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

  constructor(level: Level, container: HTMLElement) {
    this.level = level;
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
  evaluationListenerHolder: EvaluationListenerHolder;
  evaluator: Evaluator | null;
  constructor(
    editorContex: GraphEditorContext,
    animationState: Evaluator | null
  ) {
    this.editorContext = editorContex;
    this.evaluationListenerHolder = new EvaluationListenerHolder();
    this.evaluator = animationState;
  }

  destroy(): void {
    this.evaluator?.destroy();
    this.editorContext.destroy();
  }
}
