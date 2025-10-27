import { TestCase } from "./levels";
import { InputProvider, OutputChecker } from "./nodes";
import { Assert } from "./util";

type TestCaseState = {
  inputIndexes: number[];
  outputIndexes: number[];
  hasFailed: boolean;
};

export type TesterListener = {
  onExpectedOutput: (outputId: number, index: number) => void;
  onUnexpectedOutput: (
    expected: unknown,
    actual: unknown,
    outputId: number,
    index: number
  ) => void;
  onTestPassed: (index: number) => void;
  onAllTestsPassed: () => void;
};

export interface TesterEventSource {
  registerListener(l: TesterListener): number;
  deregisterListener(id: number): void;
}

export class TesterListenerHolder implements TesterEventSource, TesterListener {
  onExpectedOutput(outputId: number, index: number): void {
    this.listeners.forEach((l) => l.onExpectedOutput(outputId, index));
  }

  onUnexpectedOutput(
    expected: unknown,
    actual: unknown,
    outputId: number,
    index: number
  ): void {
    this.listeners.forEach((l) =>
      l.onUnexpectedOutput(expected, actual, outputId, index)
    );
  }

  onTestPassed(index: number): void {
    this.listeners.forEach((l) => l.onTestPassed(index));
  }

  onAllTestsPassed(): void {
    this.listeners.forEach((l) => l.onAllTestsPassed());
  }

  private listeners: Map<number, TesterListener> = new Map<
    number,
    TesterListener
  >();
  private currentListenerId: number = 0;

  registerListener(l: TesterListener): number {
    const id = this.currentListenerId++;
    this.listeners.set(id, l);
    return id;
  }

  deregisterListener(id: number): void {
    this.listeners.delete(id);
  }
}

export class Tester implements InputProvider, OutputChecker {
  testCases: TestCase[];
  currCaseIndex: number;
  currState: TestCaseState;
  listener: TesterListener;

  constructor(testCases: TestCase[], listener: TesterListener) {
    this.testCases = testCases;
    this.currCaseIndex = 0;
    this.currState = this.makeStartState(testCases[0]);
    this.listener = listener;
  }

  private makeStartState(tc: TestCase): TestCaseState {
    return {
      inputIndexes: tc.inputs.map((_i) => 0),
      outputIndexes: tc.expectedOutputs.map((_i) => 0),
      hasFailed: false,
    };
  }

  private allOutputsProduced(): boolean {
    return this.currState.outputIndexes.every(
      (v, idx) =>
        v == this.testCases[this.currCaseIndex].expectedOutputs[idx].length
    );
  }

  private allInputsConsumed(): boolean {
    return this.currState.inputIndexes.every(
      (v, idx) => v == this.testCases[this.currCaseIndex].inputs[idx].length
    );
  }

  // Maybe TODO in future - cycle a few more times before saying "Passed?"
  checkOutput(outputId: number, val: unknown): void {
    Assert(outputId < this.currState.outputIndexes.length);
    const outputIndex = this.currState.outputIndexes[outputId]++;
    const outpurArr =
      this.testCases[this.currCaseIndex].expectedOutputs[outputId];
    Assert(
      outputIndex < outpurArr.length,
      "Think execution should end before we can overflow expected outputs???"
    );
    if (outpurArr[outputIndex] !== val) {
      // TODO think more about what happens if you keep playing after failing
      this.currState.hasFailed = true;
      this.listener.onUnexpectedOutput(
        outpurArr[outputIndex],
        val,
        outputId,
        outputIndex
      );
      return;
    } else {
      this.listener.onExpectedOutput(outputId, outputIndex);
      if (this.allOutputsProduced()) {
        if (!this.currState.hasFailed) {
          Assert(
            this.allInputsConsumed(),
            "Somehow produced all outputs without consuming all inputs... Cheater!"
          );
          this.listener.onTestPassed(this.currCaseIndex);

          if (this.currCaseIndex === this.testCases.length - 1) {
            // TODO - think more about this state
            this.listener.onAllTestsPassed();
          } else {
            this.currCaseIndex++;
            this.currState = this.makeStartState(
              this.testCases[this.currCaseIndex]
            );
          }
        }
      }
    }
  }

  getInput(inputId: number) {
    Assert(inputId < this.currState.inputIndexes.length);
    const inputArr = this.testCases[this.currCaseIndex].inputs[inputId];
    if (this.currState.inputIndexes[inputId] < inputArr.length) {
      return inputArr[this.currState.inputIndexes[inputId]++];
    } else {
      return null;
    }
  }
}
