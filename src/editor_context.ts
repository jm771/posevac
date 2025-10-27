import cytoscape, { Core, NodeSingular } from "cytoscape";
// @ts-ignore - no types available
import nodeHtmlLabel from "cytoscape-node-html-label";
import { EvaluationListenerHolder, Evaluator } from "./evaluation";
import { Level } from "./levels";
import {
  CompNode,
  createInputNode,
  createOutputNode,
  InputProvider,
  OutputChecker,
  TestValuesContext,
} from "./nodes";
import { getCytoscapeStyles } from "./styles";
import { Tester, TesterListenerHolder } from "./tester";
import { Assert, NotNull } from "./util";

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
  testValuesContext: TestValuesContext;

  constructor(
    level: Level,
    testValuesContext: TestValuesContext,
    container: HTMLElement
  ) {
    this.level = level;
    this.testValuesContext = testValuesContext;
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

    const testCases = level.testCases;

    // TODO maybe this moves somewhere else
    Assert(testCases.length > 0, "No test cases");
    Assert(
      testCases.every((tc) => tc.inputs.length == testCases[0].inputs.length),
      "Not all test cases have same number of inputs"
    );
    Assert(
      testCases.every(
        (tc) => tc.expectedOutputs.length == testCases[0].expectedOutputs.length
      ),
      "Not all test cases have same number of outputs"
    );

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

    level.testCases[0].inputs.forEach(
      (_inputData: Array<unknown>, index: number) => {
        const x = 100;
        const y = startY + index * spacing;
        const inputNode = createInputNode(
          this,
          this.testValuesContext,
          x,
          y,
          index
        );

        this.inputNodes.push(inputNode);
        this.allNodes.push(inputNode);
      }
    );

    level.testCases[0].expectedOutputs.forEach(
      (_outputs: Array<unknown>, index: number) => {
        const x = 700;
        const y = startY + index * spacing;
        const outputNode = createOutputNode(
          this,
          this.testValuesContext,
          x,
          y,
          index
        );

        this.outputNodes.push(outputNode);
        this.allNodes.push(outputNode);
      }
    );
  }

  destroy(): void {
    if (this.cy) {
      this.cy.destroy();
    }
  }
}

export class LevelContext implements TestValuesContext {
  editorContext: GraphEditorContext;
  evaluationListenerHolder: EvaluationListenerHolder;
  testerListenerHolder: TesterListenerHolder;
  tester: Tester | null;
  evaluator: Evaluator | null;
  constructor(level: Level, container: HTMLElement) {
    this.editorContext = new GraphEditorContext(level, this, container);
    this.evaluationListenerHolder = new EvaluationListenerHolder();
    this.evaluator = null;
    this.testerListenerHolder = new TesterListenerHolder();
    this.tester = null;

    const lc = this;

    // TODO suuuuper unsure this is the right approach.
    this.testerListenerHolder.registerListener({
      onInputProduced: function (_inputId: number, _index: number): void {},
      onExpectedOutput: function (_outputId: number, _index: number): void {},
      onUnexpectedOutput: function (
        _expected: unknown,
        _actual: unknown,
        _outputId: number,
        _ndex: number
      ): void {},
      onTestPassed: function (_index: number): void {
        lc.evaluator = null;
      },
      onAllTestsPassed: function (): void {
        alert("All tests passed!!!");
      },
    });
  }
  getInputProvider(): InputProvider {
    return NotNull(this.tester);
  }
  getOutputChecker(): OutputChecker {
    return NotNull(this.tester);
  }

  destroy(): void {
    this.evaluator?.destroy();
    this.editorContext.destroy();
  }
}
