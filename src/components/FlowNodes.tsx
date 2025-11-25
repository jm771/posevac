// @ts-ignore
import { Handle, Node, NodeProps, Position } from "@xyflow/react";
import React, { useCallback, useContext, useRef, useState } from "react";
import {
  EcsComponent,
  EntityComponentsContext,
  OverclockMode,
} from "../contexts/ecs_context";
import {
  IONodeSetting,
  NodeSettingsContext,
  NodeSettingType,
} from "../contexts/node_settings_context";
import { NodeDefinition, NodeStyle } from "../node_definitions";
import { Assert } from "../util";

const topTerminalOffset = 10;
const terminalOffset = 30;

// classname relative - tristain link

function InputTerminals({ count }: { count: number }) {
  const inputHandles = Array.from({ length: count }, (_, i) => i);
  return (
    <>
      {inputHandles.map((i) => (
        // @ts-ignore
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
        // @ts-ignore
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

const modes = [
  OverclockMode.Regular,
  OverclockMode.Cartesian,
  OverclockMode.Zip,
];

export function OverclockSettingButton({ nodeId }: { nodeId: string }) {
  const ecs = useContext(EntityComponentsContext);
  const component = ecs.GetComponent(nodeId, EcsComponent.Overclock);
  if (component == null) {
    return null;
  }

  // TODO somewhere better

  const [index, setIndex] = useState<number>(
    modes.findIndex((x) => x === component.mode)
  );

  const onClick = useCallback(
    () =>
      setIndex((x) => {
        const newIndex = (x + 1) % modes.length;
        component.mode = modes[newIndex];
        return newIndex;
      }),
    [setIndex, component]
  );

  return (
    <button className={"constant-toggle-button repeat"} onClick={onClick}>
      {modes[index]}
    </button>
  );
}

export function CompoundNode({ id, data }: NodeProps<Node<NodeDefinition>>) {
  const settings = useContext(NodeSettingsContext);
  useContext(EntityComponentsContext).GetComponent(id, EcsComponent.Overclock);

  const nodesToFit = Math.max(data.nInputs, data.nOutputs);
  const heightTotalOffset = topTerminalOffset * 2 + 24; //12px in css
  const height = (nodesToFit - 1) * terminalOffset + heightTotalOffset;

  let label = "";
  switch (data.style.style) {
    case NodeStyle.Compound:
      label = data.style.label;
      break;
    case NodeStyle.Input:
      label = `Input ${(settings.get(id)?.setting as IONodeSetting).index}`;
      break;
    case NodeStyle.Output:
      label = `Output ${(settings.get(id)?.setting as IONodeSetting).index}`;
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
      {(data.style.style === NodeStyle.Compound ||
        data.style.style === NodeStyle.Output) && (
        <OverclockSettingButton nodeId={id} />
      )}
      <OutputTerminals count={data.nOutputs} />
    </div>
  );
}

export function ConstantNode({ id }: NodeProps<Node<NodeDefinition>>) {
  const nodeSettings = useContext(NodeSettingsContext);
  const settings = nodeSettings.get(id);

  // #YOLO
  if (!settings) return <></>;

  Assert(settings.type === NodeSettingType.Constant);

  const [value, setValue] = useState<number>(settings.setting.value);
  const [repeat, setRepeat] = useState<boolean>(settings.setting.repeat);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleValueChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      Assert(settings.type === NodeSettingType.Constant);
      const newValue = e.target.valueAsNumber;
      settings.setting.value = newValue;
      setValue(newValue);
    },
    [setValue, settings]
  );

  const handleToggleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      Assert(settings.type === NodeSettingType.Constant);
      setRepeat((r) => {
        settings.setting.repeat = !r;
        return !r;
      });
    },
    [setRepeat, settings]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" || e.key === "Escape") {
        inputRef.current?.blur();
      }
    },
    []
  );

  return (
    <div className="flow-node-constant">
      <InputTerminals count={0} />
      <input
        ref={inputRef}
        type="number"
        className="constant-value-input"
        value={value}
        onChange={handleValueChange}
        onKeyDown={handleKeyDown}
      />
      <button
        className={`constant-toggle-button ${repeat ? "repeat" : "once"}`}
        onClick={handleToggleClick}
      >
        {repeat ? "REPEAT" : "ONCE"}
      </button>
      <OutputTerminals count={1} />
    </div>
  );
}
