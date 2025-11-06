import { Handle, Position } from "@xyflow/react";
import React from "react";
import { NodeDefinition, NodeStyle } from "../node_definitions";

export type FlowNodeData = {
  label: string;
  style: NodeStyle;
  inputCount: number;
  outputCount: number;
  constantValue?: unknown;
  constantRepeat?: boolean;
};

export function getFlowNodeDataFromDefintion(
  defn: NodeDefinition
): FlowNodeData {
  let label = "N/A";

  switch (defn.style.style) {
    case NodeStyle.Compound:
      ({ label } = defn.style);
      break;
    case NodeStyle.Input:
      label = "input";
      break;
    case NodeStyle.Output:
      label = "output";
      break;
  }

  return {
    label: label,
    // Unsure if used
    style: defn.style.style,
    inputCount: defn.nInputs,
    outputCount: defn.nOutputs,
    constantValue: undefined,
    constantRepeat: undefined,
  };
}

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

export function CompoundNode({ data }: { data: FlowNodeData }) {
  const nodesToFit = Math.max(data.inputCount, data.outputCount);
  const heightTotalOffset = topTerminalOffset * 2 + 24; //12px in css
  const height = (nodesToFit - 1) * terminalOffset + heightTotalOffset;

  return (
    <div
      className={`flow-node-${data.style}`}
      style={{
        height: height,
        width: 120,
      }}
    >
      <InputTerminals count={data.inputCount} />
      {data.label}
      <OutputTerminals count={data.outputCount} />
    </div>
  );
}

// export function InputNode({ data }: { data: FlowNodeData }) {
//   return (
//     <div className="flow-node-input">
//       {data.label}
//       <OutputTerminals count={1} />
//     </div>
//   );
// }

// export function OutputNode({ data }: { data: FlowNodeData }) {
//   return (
//     <div className="flow-node-output">
//       <InputTerminals count={1} />
//       {data.label}
//     </div>
//   );
// }

export function ConstantNode({ data }: { data: FlowNodeData }) {
  return (
    <div className="flow-node-constant">
      {data.constantValue !== undefined && (
        <div className="flow-node-constant-value">
          {String(data.constantValue)}
        </div>
      )}
      {data.constantRepeat !== undefined && (
        <div className="flow-node-constant-mode">
          {data.constantRepeat ? "repeat" : "once"}
        </div>
      )}
      <Handle type="source" position={Position.Right} id="output-0" />
    </div>
  );
}
