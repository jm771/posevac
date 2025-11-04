import { Handle, NodeProps, Position } from "@xyflow/react";
import React from "react";

export type FlowNodeData = {
  label: string;
  type: string;
  inputCount: number;
  outputCount: number;
  constantValue?: unknown;
  constantRepeat?: boolean;
};

const topTerminalOffset = 10;
const terminalOffset = 30;

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
      className="flow-node-compound"
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

export function InputNode({ data }: NodeProps<FlowNodeData>) {
  return (
    <div className="flow-node-input">
      {data.label}
      <Handle type="source" position={Position.Right} id="output-0" />
    </div>
  );
}

export function OutputNode({ data }: NodeProps<FlowNodeData>) {
  return (
    <div className="flow-node-output">
      <Handle type="target" position={Position.Left} id="input-0" />
      {data.label}
    </div>
  );
}

export function ConstantNode({ data }: NodeProps<FlowNodeData>) {
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
