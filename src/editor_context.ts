import cytoscape, { Core, NodeSingular } from "cytoscape";
// @ts-ignore - no types available
// import nodeHtmlLabel from "cytoscape-node-html-label";
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
import { Tester, TesterListenerHolder } from "./tester";
import { Assert, NotNull } from "./util";

export interface NodeBuildContext {
  nodeIdCounter: number;
}

type NodeId = string;
type TerminalIndex = number;

export enum TerminalType {
  Input,
  Output,
}

export type TerminalId = {
  // type: TerminalType
  nodeId: NodeId;
  terminalIndex: TerminalIndex;
};

export type Connection = {
  source: TerminalId;
  dest: TerminalId;
};

export class PosFlo {
  nodes: CompNode[];
  connections: Connection[];

  constructor(initalNodes: CompNode[] = []) {
    this.nodes = initalNodes;
    this.connections = [];
  }

  AddNode(node: CompNode) {}

  AddNode(node: CompNode) {}

  AddConnection(connection: Connection) {}

  RemoveConnection(connection: Connection) {}
}

export class GraphEditorContext implements NodeBuildContext {
  public cy: Core;
  public level: Level;
  public inputNodes: CompNode[] = [];
  public outputNodes: CompNode[] = [];
  public allNodes: CompNode[] = [];
  public nodeIdCounter = 0;
  testValuesContext: TestValuesContext;

  constructor(level: Level, testValuesContext: TestValuesContext) {
    this.level = level;
    this.testValuesContext = testValuesContext;
    this.cy = cytoscape();

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
    return this.getNodeIndexForNodeId(node.id());
  }

  getNodeForId(nodeId: string): CompNode {
    const idx = this.getNodeIndexForNodeId(nodeId);
    Assert(idx >= 0, `Couldn't find node ${nodeId}`);
    return this.allNodes[idx];
  }

  tryGetCompNodeForNode(node: NodeSingular): CompNode | null {
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
  constructor(level: Level) {
    this.editorContext = new GraphEditorContext(level, this);
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
        _testCaseIndex: number,
        _expected: unknown,
        _actual: unknown,
        _outputId: number,
        _ndex: number
      ): void {},
      onTestPassed: function (_index: number): void {
        lc.evaluator = null;
      },
      onAllTestsPassed: function (): void {},
      onTestCaseStart: function (_testCaseIndex: number): void {},
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
