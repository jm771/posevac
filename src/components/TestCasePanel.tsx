import React, { useEffect, useState } from "react";
import { LevelContext } from "../editor_context";
import { TesterListener } from "../tester";

enum InputStatus {
  Pending = "io-value-pending",
  Produced = "io-value-produced",
}

enum OutputStatus {
  Pending = "io-value-pending",
  Correct = "io-value-correct",
  Incorrect = "io-value-incorrect",
  TestPassed = "io-value-test-passed",
}

export function TestCasePanel({
  levelContext,
}: {
  levelContext: LevelContext;
}) {
  const makeFreshInputStates = () =>
    levelContext.editorContext.level.testCases.map((c) =>
      c.inputs.map((arr) => arr.map(() => InputStatus.Pending))
    );
  const makeFreshOutputStates = () =>
    levelContext.editorContext.level.testCases.map((c) =>
      c.expectedOutputs.map((arr) => arr.map(() => OutputStatus.Pending))
    );

  const [currentTestIndex, setCurrentTestIndex] = useState(0);
  const [inputStates, setInputStates] =
    useState<InputStatus[][][]>(makeFreshInputStates);
  const [outputStates, setOutputStates] = useState<OutputStatus[][][]>(
    makeFreshOutputStates
  );

  useEffect(() => {
    const listener: TesterListener = {
      onInputProduced: (
        testCaseIndex: number,
        inputId: number,
        index: number
      ) => {
        setInputStates((prev: InputStatus[][][]) => {
          const newStates = [...prev];
          newStates[testCaseIndex][inputId][index] = InputStatus.Produced;
          return newStates;
        });
      },

      onExpectedOutput: (
        testCaseIndex: number,
        outputId: number,
        index: number
      ) => {
        setOutputStates((prev: OutputStatus[][][]) => {
          const newStates = [...prev];
          newStates[testCaseIndex][outputId][index] = OutputStatus.Correct;
          return newStates;
        });
      },

      onUnexpectedOutput: (
        testCaseIndex: number,
        _expected: unknown,
        _actual: unknown,
        outputId: number,
        index: number
      ) => {
        setOutputStates((prev: OutputStatus[][][]) => {
          const newStates = [...prev];
          newStates[testCaseIndex][outputId][index] = OutputStatus.Incorrect;
          return newStates;
        });
      },

      onTestPassed: (testCaseIndex: number) => {
        setOutputStates((prev: OutputStatus[][][]) => {
          const newStates = [...prev];
          newStates[testCaseIndex] = newStates[testCaseIndex].map((arr) =>
            arr.map((_) => OutputStatus.TestPassed)
          );
          return newStates;
        });
      },

      onAllTestsPassed: () => {
        alert("All tests passed!!!");
      },
      onTestCaseStart: function (testCaseIndex: number): void {
        if (testCaseIndex === 0) {
          setInputStates(makeFreshInputStates);
          setOutputStates(makeFreshOutputStates);
        }

        console.log("starting test case", testCaseIndex);
        setCurrentTestIndex(testCaseIndex);
      },
    };

    const listenerId =
      levelContext.testerListenerHolder.registerListener(listener);

    return () => {
      levelContext.testerListenerHolder.deregisterListener(listenerId);
    };
  }, [levelContext]);

  const totalTests = levelContext.editorContext.level.testCases.length;

  const handlePrevTest = () => {
    setCurrentTestIndex((prev) => (prev > 0 ? prev - 1 : prev));
  };

  const handleNextTest = () => {
    setCurrentTestIndex((prev) => (prev < totalTests - 1 ? prev + 1 : prev));
  };

  const currTestCase =
    levelContext.editorContext.level.testCases[currentTestIndex];

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
            {currTestCase.inputs.map((inputArr, inputId) => (
              <div key={inputId} className="io-row">
                <div className="io-label">Input {inputId}</div>
                <div className="io-values">
                  {inputArr.map((input, idx) => (
                    <div
                      key={idx}
                      className={`io-value ${inputStates[currentTestIndex][inputId][idx]}`}
                    >
                      {String(input)}
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
            {currTestCase.expectedOutputs.map((outputArr, outputId) => (
              <div key={outputId} className="io-row">
                <div className="io-label">Output {outputId}</div>
                <div className="io-values">
                  {outputArr.map((output, idx) => (
                    <div
                      key={idx}
                      className={`io-value ${outputStates[currentTestIndex][outputId][idx]}`}
                    >
                      {String(output)}
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
