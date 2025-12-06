// It should be easy to add "standard" custom nodes here. But nodes that have customizable settings
// (e.g. the constant node) will require UI work

import {
  ConstantNodeSettings,
  IONodeSetting,
  NodeSettingType,
} from "./contexts/node_settings_context";
import { TestValuesContext } from "./nodes";
import { Assert, getOrThrow } from "./util";

export enum NodeStyle {
  Compound = "compound",
  Input = "input",
  Output = "output",
  Constant = "constant",
}

export type StyleData =
  | { style: NodeStyle.Compound; label: string }
  | { style: NodeStyle.Input }
  | { style: NodeStyle.Output }
  | { style: NodeStyle.Constant };

export enum RegularComponentType {
  Plus = "plus",
  Multiply = "multiply",
  Combine = "combine",
  Split = "split",
  Nop = "nop",
  Constant = "constant",
  Push = "push",
  Pop = "pop",
  Empty = "empty",
  Sum = "sum",
  Max = "max",
  RightShift = "rsh",
  ISqrt = "isqrt",
  Modulo = "modulo",
}

export enum InputOutputComponentType {
  Input = "input",
  Output = "output",
}

export type ComponentType = RegularComponentType | InputOutputComponentType;

export type NodeDefinitionImpl<TState, TSettings> = {
  componentType: ComponentType;
  style: StyleData;
  nInputs: number;
  nOutputs: number;
  deletable: boolean;
  settingType: NodeSettingType;

  makeState(): TState;
  evaluate(
    state: TState,
    settings: TSettings,
    args: unknown[],
    testValues: TestValuesContext
  ): unknown[] | null;
};

function MakeStandardNodeDefinition(
  componentType: RegularComponentType,
  label: string,
  nInputs: number,
  nOutputs: number,
  func: (args: unknown[]) => unknown[]
): NodeDefinitionImpl<void, void> {
  return {
    componentType,
    style: { style: NodeStyle.Compound, label: label },
    nInputs: nInputs,
    nOutputs: nOutputs,
    deletable: true,
    settingType: NodeSettingType.None,
    makeState: () => {},
    evaluate: (
      _state: unknown,
      _settings: unknown,
      args: unknown[],
      _testValues: TestValuesContext
    ) => func(args),
  };
}

type ConstantNodeState = {
  hasEvaluated: boolean;
};

const ConstantNodeDefinition: NodeDefinitionImpl<
  ConstantNodeState,
  ConstantNodeSettings
> = {
  componentType: RegularComponentType.Constant,
  style: { style: NodeStyle.Constant },
  nInputs: 0,
  nOutputs: 1,
  deletable: true,
  settingType: NodeSettingType.Constant,
  makeState: () => {
    return { hasEvaluated: false };
  },
  evaluate: (
    state: ConstantNodeState,
    settings: ConstantNodeSettings,
    _args: unknown[],
    _testValues: TestValuesContext
  ) => {
    const ret =
      !state.hasEvaluated || settings.repeat ? [settings.value] : null;
    state.hasEvaluated = true;
    return ret;
  },
};

const InputNodeDefinition: NodeDefinitionImpl<void, IONodeSetting> = {
  componentType: InputOutputComponentType.Input,
  style: { style: NodeStyle.Input },
  nInputs: 0,
  nOutputs: 1,
  deletable: false,
  settingType: NodeSettingType.None,
  makeState: () => {
    return { index: 0 };
  },
  evaluate: (
    _state: void,
    settings: IONodeSetting,
    _args: unknown[],
    testValues: TestValuesContext
  ) => {
    const ret = testValues.getInputProvider().getInput(settings.index);
    return ret === null ? null : [ret];
  },
};

const OutputNodeDefinition: NodeDefinitionImpl<void, IONodeSetting> = {
  componentType: InputOutputComponentType.Output,
  style: { style: NodeStyle.Output },
  nInputs: 1,
  nOutputs: 0,
  deletable: false,
  settingType: NodeSettingType.None,
  makeState: () => {
    return { index: 0 };
  },
  evaluate: (
    _state: void,
    settings: IONodeSetting,
    args: unknown[],
    testValues: TestValuesContext
  ) => {
    testValues.getOutputChecker().checkOutput(settings.index, args[0]);
    return [];
  },
};

export type NodeDefinition = NodeDefinitionImpl<unknown, unknown>;

const typeToDefinitionMap = new Map<ComponentType, NodeDefinition>(
  [
    MakeStandardNodeDefinition(
      RegularComponentType.Plus,
      "+",
      2,
      1,
      (arr: unknown[]) => {
        Assert(typeof arr[0] === "number" && typeof arr[1] === "number");
        return [arr[0] + arr[1]];
      }
    ),

    MakeStandardNodeDefinition(
      RegularComponentType.Multiply,
      "x",
      2,
      1,
      (arr: unknown[]) => {
        Assert(typeof arr[0] === "number" && typeof arr[1] === "number");
        return [arr[0] * arr[1]];
      }
    ),

    MakeStandardNodeDefinition(
      RegularComponentType.RightShift,
      "rsh",
      1,
      1,
      (arr: unknown[]) => {
        Assert(typeof arr[0] === "number");
        return [arr[0] >> 1];
      }
    ),

    MakeStandardNodeDefinition(
      RegularComponentType.Max,
      "max",
      2,
      1,
      (arr: unknown[]) => {
        Assert(typeof arr[0] === "number" && typeof arr[1] === "number");
        return [Math.max(arr[0],arr[1])];
      }
    ),

    MakeStandardNodeDefinition(
      RegularComponentType.ISqrt,
      "isqrt",
      1,
      1,
      (arr: unknown[]) => {
        Assert(typeof arr[0] === "number");
        return [Math.floor(Math.sqrt(arr[0]))];
      }
    ),

    MakeStandardNodeDefinition(
      RegularComponentType.Modulo,
      "modulo",
      2,
      1,
      (arr: unknown[]) => {
        Assert(typeof arr[0] === "number" && typeof arr[1] === "number");
        return [arr[0] % arr[1]];
      }
    ),

    MakeStandardNodeDefinition(
      RegularComponentType.Combine,
      "combine",
      2,
      1,
      (arr: unknown[]) => [arr]
    ),

    MakeStandardNodeDefinition(
      RegularComponentType.Split,
      "split",
      1,
      2,
      (arr: unknown[]) => {
        Assert(arr[0] instanceof Array);
        return arr[0];
      }
    ),

    MakeStandardNodeDefinition(
      RegularComponentType.Nop,
      "nop",
      1,
      1,
      (arr: unknown[]) => arr
    ),
    MakeStandardNodeDefinition(
      RegularComponentType.Push,
      "push",
      2,
      1,
      ([v, arr]: unknown[]) => {
        Assert(arr instanceof Array);
        return [[...arr, v]];
      }
    ),
    MakeStandardNodeDefinition(
      RegularComponentType.Pop,
      "pop",
      1,
      2,
      ([arr]: unknown[]) => {
        Assert(arr instanceof Array);
        const n = [...arr];
        return [n.pop(), n];
      }
    ),
    MakeStandardNodeDefinition(RegularComponentType.Empty, "[]", 0, 1, () => [
      [],
    ]),

    ConstantNodeDefinition,
    InputNodeDefinition,
    OutputNodeDefinition,
  ].map((x) => [x.componentType, x])
);

export function GetNodeDefinition(type: ComponentType): NodeDefinition {
  return getOrThrow(typeToDefinitionMap, type);
}
