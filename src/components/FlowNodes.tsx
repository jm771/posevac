import { Handle, Position } from "@xyflow/react";
import React from "react";
import { NodeDefinition, NodeStyle } from "../node_definitions";

const topTerminalOffset = 10;
const terminalOffset = 30;

// classname relative - tristain link

function InputTerminals({ count }: { count: number }) {
  const inputHandles = Array.from({ length: count }, (_, i) => i);
  return (
    <>
      {inputHandles.map((i) => (
        <Handle
          key={`input-${i}`}
          type="target"
          position={Position.Left}
          id={`input-${i}`}
          style={{
            top: `${
              (100 * (terminalOffset * i + topTerminalOffset)) /
              (2 * topTerminalOffset + terminalOffset * (count - 1))
            }%`,
          }}
        />
      ))}
    </>
  );
}

function OutputTerminals({ count }: { count: number }) {
  const outputHandles = Array.from({ length: count }, (_, i) => i);

  return (
    <>
      {outputHandles.map((i) => (
        <Handle
          key={`output-${i}`}
          type="source"
          position={Position.Right}
          id={`output-${i}`}
          style={{
            // pointerEvents: "none",
            top: `${
              (100 * (terminalOffset * i + topTerminalOffset)) /
              (2 * topTerminalOffset + terminalOffset * (count - 1))
            }%`,
          }}
        />
      ))}
    </>
  );
}

export function CompoundNode({ data }: { data: NodeDefinition }) {
  const nodesToFit = Math.max(data.nInputs, data.nOutputs);
  const heightTotalOffset = topTerminalOffset * 2 + 24; //12px in css
  const height = (nodesToFit - 1) * terminalOffset + heightTotalOffset;

  let label = "";
  switch (data.style.style) {
    case NodeStyle.Compound:
      label = data.style.label;
      break;
    case NodeStyle.Input:
      label = "Input";
      break;
    case NodeStyle.Output:
      label = "Output";
      break;
    case NodeStyle.Constant:
  }

  return (
    <div
      className={`flow-node-${data.style.style}`}
      style={{
        height: height,
        width: 120,
      }}
    >
      <InputTerminals count={data.nInputs} />
      {label}
      <OutputTerminals count={data.nOutputs} />
    </div>
  );
}

export function ConstantNode({ data }: { data: NodeDefinition }) {
  return (
    <div className="flow-node-constant">
      {/* {data.constantValue !== undefined && (
        <div className="flow-node-constant-value">
          {String(data.constantValue)}
        </div>
      )}
      {data.constantRepeat !== undefined && (
        <div className="flow-node-constant-mode">
          {data.constantRepeat ? "repeat" : "once"}
        </div>
      )} */}
      Constant!
      <Handle type="source" position={Position.Right} id="output-0" />
    </div>
  );
}
