import { TestCase } from "./levels";
import { InputProvider, OutputChecker } from "./nodes";
import { Assert } from "./util";

type TestCaseState = {
  inputIndexes: number[];
  outputIndexes: number[];
  hasFailed: boolean;
};

export type TesterListener = {
  onTestCaseStart: (testCaseIndex: number) => void;
  onExpectedOutput: (
    testCaseIndex: number,
    outputId: number,
    index: number
  ) => void;
  onInputProduced: (
    testCaseIndex: number,
    inputId: number,
    index: number
  ) => void;
  onUnexpectedOutput: (
    testCaseIndex: number,
    expected: unknown,
    actual: unknown,
    outputId: number,
    index: number
  ) => void;
  onTestPassed: (testCaseIndex: number) => void;
  onAllTestsPassed: () => void;
};

export interface TesterEventSource {
  registerListener(l: TesterListener): number;
  deregisterListener(id: number): void;
}

export class TesterListenerHolder implements TesterEventSource, TesterListener {
  onTestCaseStart(testCaseIndex: number): void {
    this.listeners.forEach((l) => l.onTestCaseStart(testCaseIndex));
  }

  onExpectedOutput(
    testCaseIndex: number,
    outputId: number,
    index: number
  ): void {
    this.listeners.forEach((l) =>
      l.onExpectedOutput(testCaseIndex, outputId, index)
    );
  }

  onUnexpectedOutput(
    testCaseIndex: number,
    expected: unknown,
    actual: unknown,
    outputId: number,
    index: number
  ): void {
    this.listeners.forEach((l) =>
      l.onUnexpectedOutput(testCaseIndex, expected, actual, outputId, index)
    );
  }

  onTestPassed(index: number): void {
    this.listeners.forEach((l) => l.onTestPassed(index));
  }

  onAllTestsPassed(): void {
    this.listeners.forEach((l) => l.onAllTestsPassed());
  }

  onInputProduced(testCaseIndex: number, inputId: number, index: number): void {
    this.listeners.forEach((l) =>
      l.onInputProduced(testCaseIndex, inputId, index)
    );
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
    this.listener.onTestCaseStart(0);
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
        v === this.testCases[this.currCaseIndex].expectedOutputs[idx].length
    );
  }

  private allInputsConsumed(): boolean {
    return this.currState.inputIndexes.every(
      (v, idx) => v === this.testCases[this.currCaseIndex].inputs[idx].length
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
        this.currCaseIndex,
        outpurArr[outputIndex],
        val,
        outputId,
        outputIndex
      );
      return;
    } else {
      this.listener.onExpectedOutput(this.currCaseIndex, outputId, outputIndex);
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
            this.listener.onTestCaseStart(this.currCaseIndex);
          }
        }
      }
    }
  }

  getInput(inputId: number) {
    Assert(inputId < this.currState.inputIndexes.length);
    const inputArr = this.testCases[this.currCaseIndex].inputs[inputId];
    if (this.currState.inputIndexes[inputId] < inputArr.length) {
      const inputIndex = this.currState.inputIndexes[inputId]++;
      this.listener.onInputProduced(this.currCaseIndex, inputId, inputIndex);
      return inputArr[inputIndex];
    } else {
      return null;
    }
  }
}
