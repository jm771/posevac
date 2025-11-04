import React from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";

export type FlowNodeData = {
  label: string;
  type: string;
  inputCount: number;
  outputCount: number;
  constantValue?: unknown;
  constantRepeat?: boolean;
};

export function CompoundNode({ data }: NodeProps<FlowNodeData>) {
  const inputHandles = Array.from({ length: data.inputCount }, (_, i) => i);
  const outputHandles = Array.from({ length: data.outputCount }, (_, i) => i);

  return (
    <div className="flow-node-compound">
      {inputHandles.map((i) => (
        <Handle
          key={`input-${i}`}
          type="target"
          position={Position.Left}
          id={`input-${i}`}
          style={{
            top: `${((i + 1) * 100) / (inputHandles.length + 1)}%`,
          }}
        />
      ))}
      {data.label}
      {outputHandles.map((i) => (
        <Handle
          key={`output-${i}`}
          type="source"
          position={Position.Right}
          id={`output-${i}`}
          style={{
            top: `${((i + 1) * 100) / (outputHandles.length + 1)}%`,
          }}
        />
      ))}
    </div>
  );
}

export function InputNode({ data }: NodeProps<FlowNodeData>) {
  return (
    <div className="flow-node-input">
      {data.label}
      <Handle
        type="source"
        position={Position.Right}
        id="output-0"
      />
    </div>
  );
}

export function OutputNode({ data }: NodeProps<FlowNodeData>) {
  return (
    <div className="flow-node-output">
      <Handle
        type="target"
        position={Position.Left}
        id="input-0"
      />
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
      <Handle
        type="source"
        position={Position.Right}
        id="output-0"
      />
    </div>
  );
}
