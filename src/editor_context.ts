// @ts-ignore - no types available
// import nodeHtmlLabel from "cytoscape-node-html-label";
import { EvaluationListenerHolder, Evaluator } from "./evaluation";
import { MakeInputNode, MakeOutputNode } from "./input_output_nodes";
import { Level, nInputs, nOutputs } from "./levels";
import { GetNodeDefinition, RegularComponentType } from "./node_definitions";
import {
  ComputeNode,
  InputProvider,
  OutputChecker,
  TestValuesContext,
} from "./nodes";
import { PosFlo } from "./pos_flow";
import { Tester, TesterListenerHolder } from "./tester";
import { NotNull, range } from "./util";

export class GraphEditorContext {
  public level: Level;
  posFlow: PosFlo;
  testValuesContext: TestValuesContext;

  constructor(level: Level, testValuesContext: TestValuesContext) {
    this.level = level;
    this.testValuesContext = testValuesContext;
    this.posFlow = new PosFlo();
  }

  AddInputOutputNodes() {
    range(nInputs(this.level)).forEach((idx) =>
      this.posFlow.AddNode(MakeInputNode(idx, this.testValuesContext))
    );

    range(nOutputs(this.level)).forEach((idx) =>
      this.posFlow.AddNode(MakeOutputNode(idx, this.testValuesContext))
    );
  }

  AddNode(type: RegularComponentType): ComputeNode {
    return this.posFlow.AddNode(GetNodeDefinition(type));
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
