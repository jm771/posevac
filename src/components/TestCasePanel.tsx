import React, { useEffect, useState } from "react";
import { LevelContext } from "../editor_context";
import { TesterListener } from "../tester";

type IOStatus = "pending" | "produced" | "correct" | "incorrect";

interface InputState {
  value: unknown;
  status: IOStatus;
}

interface OutputState {
  value: unknown;
  status: IOStatus;
}

interface TestCaseState {
  inputs: InputState[][];
  outputs: OutputState[][];
}

export function TestCasePanel({
  levelContext,
}: {
  levelContext: LevelContext;
}) {
  const [currentTestIndex, setCurrentTestIndex] = useState(0);
  const [testCaseStates, setTestCaseStates] = useState<TestCaseState[]>([]);

  useEffect(() => {
    const level = levelContext.editorContext.level;
    const initialStates: TestCaseState[] = level.testCases.map((tc) => ({
      inputs: tc.inputs.map((inputArr) =>
        inputArr.map((value) => ({ value, status: "pending" as IOStatus }))
      ),
      outputs: tc.expectedOutputs.map((outputArr) =>
        outputArr.map((value) => ({ value, status: "pending" as IOStatus }))
      ),
    }));

    setTestCaseStates(initialStates);
    setCurrentTestIndex(0);
  }, [levelContext]);

  useEffect(() => {
    const listener: TesterListener = {
      onInputProduced: (inputId: number, index: number) => {
        setTestCaseStates((prev) => {
          const newStates = [...prev];
          const currentState = { ...newStates[currentTestIndex] };
          const newInputs = [...currentState.inputs];
          newInputs[inputId] = [...newInputs[inputId]];
          newInputs[inputId][index] = {
            ...newInputs[inputId][index],
            status: "produced",
          };
          currentState.inputs = newInputs;
          newStates[currentTestIndex] = currentState;
          return newStates;
        });
      },

      onExpectedOutput: (outputId: number, index: number) => {
        setTestCaseStates((prev) => {
          const newStates = [...prev];
          const currentState = { ...newStates[currentTestIndex] };
          const newOutputs = [...currentState.outputs];
          newOutputs[outputId] = [...newOutputs[outputId]];
          newOutputs[outputId][index] = {
            ...newOutputs[outputId][index],
            status: "correct",
          };
          currentState.outputs = newOutputs;
          newStates[currentTestIndex] = currentState;
          return newStates;
        });
      },

      onUnexpectedOutput: (
        _expected: unknown,
        _actual: unknown,
        outputId: number,
        index: number
      ) => {
        setTestCaseStates((prev) => {
          const newStates = [...prev];
          const currentState = { ...newStates[currentTestIndex] };
          const newOutputs = [...currentState.outputs];
          newOutputs[outputId] = [...newOutputs[outputId]];
          newOutputs[outputId][index] = {
            ...newOutputs[outputId][index],
            status: "incorrect",
          };
          currentState.outputs = newOutputs;
          newStates[currentTestIndex] = currentState;
          return newStates;
        });
      },

      onTestPassed: (_index: number) => {
        setCurrentTestIndex((prev) =>
          prev < levelContext.editorContext.level.testCases.length - 1
            ? prev + 1
            : prev
        );
      },

      onAllTestsPassed: () => {},
    };

    const listenerId =
      levelContext.testerListenerHolder.registerListener(listener);

    return () => {
      levelContext.testerListenerHolder.deregisterListener(listenerId);
    };
  }, [levelContext, currentTestIndex]);

  useEffect(() => {
    const checkInterval = setInterval(() => {
      if (levelContext.tester === null) {
        setCurrentTestIndex(0);
        const level = levelContext.editorContext.level;
        const initialStates: TestCaseState[] = level.testCases.map((tc) => ({
          inputs: tc.inputs.map((inputArr) =>
            inputArr.map((value) => ({ value, status: "pending" as IOStatus }))
          ),
          outputs: tc.expectedOutputs.map((outputArr) =>
            outputArr.map((value) => ({ value, status: "pending" as IOStatus }))
          ),
        }));
        setTestCaseStates(initialStates);
      }
    }, 100);

    return () => clearInterval(checkInterval);
  }, [levelContext]);

  if (testCaseStates.length === 0) {
    return null;
  }

  const currentState = testCaseStates[currentTestIndex];
  const totalTests = levelContext.editorContext.level.testCases.length;

  const handlePrevTest = () => {
    setCurrentTestIndex((prev) => (prev > 0 ? prev - 1 : prev));
  };

  const handleNextTest = () => {
    setCurrentTestIndex((prev) =>
      prev < totalTests - 1 ? prev + 1 : prev
    );
  };

  const getStatusClass = (status: IOStatus): string => {
    switch (status) {
      case "pending":
        return "io-value-pending";
      case "produced":
        return "io-value-produced";
      case "correct":
        return "io-value-correct";
      case "incorrect":
        return "io-value-incorrect";
      default:
        return "";
    }
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
