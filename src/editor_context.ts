import Flow from "@xyflow/react";
import { createContext } from "react";
import { Evaluator } from "./evaluation";
import { EvaluationListenerHolder } from "./evaluation_listeners";
import { Level } from "./levels";
import { InputProvider, OutputChecker, TestValuesContext } from "./nodes";
import { Tester, TesterListenerHolder } from "./tester";
import { NotNull } from "./util";

function edgeMatches(e1: Flow.Edge, e2: Flow.Connection): boolean {
  return (
    e1.source === e2.source &&
    e1.sourceHandle === e2.sourceHandle &&
    e1.target === e2.target &&
    e1.targetHandle === e2.targetHandle
  );
}

export class LevelContext implements TestValuesContext {
  evaluationListenerHolder: EvaluationListenerHolder;
  testerListenerHolder: TesterListenerHolder;
  tester: Tester | null;
  evaluator: Evaluator | null;
  level: Level;
  constructor(level: Level) {
    this.evaluationListenerHolder = new EvaluationListenerHolder();
    this.evaluator = null;
    this.testerListenerHolder = new TesterListenerHolder();
    this.tester = null;
    this.level = level;

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
  }
}

export const LevelContextContext = createContext<LevelContext>(
  null as unknown as LevelContext
);
