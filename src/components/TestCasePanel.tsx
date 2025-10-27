import React, { useEffect, useState } from "react";
import { LevelContext } from "../editor_context";
import {
  CounterAdvanceEvent,
  EvaluationEvent,
  EvaluationListener,
  NodeEvaluateEvent,
} from "../evaluation";
import { TesterListener } from "../tester";
import { Assert } from "../util";

enum InputStatus {
  Pending = "io-value-pending",
  Produced = "io-value-produced",
}

enum OutputStatus {
  Pending = "io-value-pending",
  Correct = "io-value-correct",
  Incorrect = "io-value-incorrect",
}

export function TestCasePanel({
  levelContext,
}: {
  levelContext: LevelContext;
}) {
  const makeFreshInputStates = () =>
    levelContext.editorContext.level.testCases.map((c) =>
      c.inputs.map(() => InputStatus.Pending)
    );
  const makeFreshOutputStates = () =>
    levelContext.editorContext.level.testCases.map((c) =>
      c.expectedOutputs.map(() => OutputStatus.Pending)
    );

  const [currentTestIndex, setCurrentTestIndex] = useState(0);
  const [inputStates, setInputStates] =
    useState<InputStatus[][]>(makeFreshInputStates);
  const [outputStates, setOutputStates] = useState<OutputStatus[][]>(
    makeFreshOutputStates
  );

  useEffect(() => {
    const listener: TesterListener = {
      onInputProduced: (inputId: number, index: number) => {
        setInputStates((prev: InputStatus[][]) => {
          const newStates = [...prev];
          newStates[inputId][index] = InputStatus.Produced;
          return newStates;
        });
      },

      onExpectedOutput: (outputId: number, index: number) => {
        setOutputStates((prev: OutputStatus[][]) => {
          const newStates = [...prev];
          newStates[outputId][index] = OutputStatus.Correct;
          return newStates;
        });
      },

      onUnexpectedOutput: (
        _expected: unknown,
        _actual: unknown,
        outputId: number,
        index: number
      ) => {
        setOutputStates((prev: OutputStatus[][]) => {
          const newStates = [...prev];
          newStates[outputId][index] = OutputStatus.Incorrect;
          return newStates;
        });
      },

      onTestPassed: (_index: number) => {
        setCurrentTestIndex(
          _index < levelContext.editorContext.level.testCases.length - 1
            ? _index + 1
            : _index
        );
      },

      onAllTestsPassed: () => {},
    };

    const listenerId =
      levelContext.testerListenerHolder.registerListener(listener);

    return () => {
      levelContext.testerListenerHolder.deregisterListener(listenerId);
    };
  }, [levelContext]);

  useEffect(() => {
    const listener: EvaluationListener = {
      onCounterAdvance: function (e: CounterAdvanceEvent): void {},
      onNodeEvaluate: function (e: NodeEvaluateEvent): void {},
      onEvaluationEvent: function (e: EvaluationEvent): void {
        Assert(e === EvaluationEvent.End || e === EvaluationEvent.Start);
        setCurrentTestIndex(0);
        setInputStates(makeFreshInputStates);
        setOutputStates(makeFreshOutputStates);
      },
    };

    const listenerId =
      levelContext.evaluationListenerHolder.registerListener(listener);

    return () => {
      levelContext.evaluationListenerHolder.deregisterListener(listenerId);
    };
  }, [levelContext]);

  const totalTests = levelContext.editorContext.level.testCases.length;

  const handlePrevTest = () => {
    setCurrentTestIndex((prev) => (prev > 0 ? prev - 1 : prev));
  };

  const handleNextTest = () => {
    setCurrentTestIndex((prev) => (prev < totalTests - 1 ? prev + 1 : prev));
  };

  return (
    <div className="test-case-panel">
      <div className="test-case-header">
        <h3>Test Case</h3>
        <div className="test-case-navigation">
          <button
            onClick={handlePrevTest}
            disabled={currentTestIndex === 0}
            className="nav-arrow"
          >
            ◄
          </button>
          <span className="test-case-counter">
            {currentTestIndex + 1} / {totalTests}
          </span>
          <button
            onClick={handleNextTest}
            disabled={currentTestIndex === totalTests - 1}
            className="nav-arrow"
          >
            ►
          </button>
        </div>
      </div>

      <div className="test-case-content">
        <div className="test-case-section">
          <h4>Inputs</h4>
          <div className="io-grid">
            {currentState.inputs.map((inputArr, inputId) => (
              <div key={inputId} className="io-row">
                <div className="io-label">Input {inputId}</div>
                <div className="io-values">
                  {inputArr.map((input, idx) => (
                    <div
                      key={idx}
                      className={`io-value ${getStatusClass(input.status)}`}
                    >
                      {String(input.value)}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="test-case-section">
          <h4>Expected Outputs</h4>
          <div className="io-grid">
            {currentState.outputs.map((outputArr, outputId) => (
              <div key={outputId} className="io-row">
                <div className="io-label">Output {outputId}</div>
                <div className="io-values">
                  {outputArr.map((output, idx) => (
                    <div
                      key={idx}
                      className={`io-value ${getStatusClass(output.status)}`}
                    >
                      {String(output.value)}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
