// It should be easy to add "standard" custom nodes here. But nodes that have customizable settings
// (e.g. the constant node) will require UI work

import { Assert, getOrThrow } from "./util";

export enum NodeStyle {
  Compound = "compound",
  Input = "input",
  Output = "output",
  Constant = "constant",
}

export type ConstantNodeSettings = {
  repeat: boolean;
  value: number;
};

export type StyleData =
  | { style: NodeStyle.Compound; label: string }
  | { style: NodeStyle };

export enum RegularComponentType {
  Plus = "plus",
  Multiply = "multiply",
  Combine = "combine",
  Split = "split",
  Nop = "nop",
  Constant = "constant",
}

export enum InputOutputComponentType {
  Input = "input",
  Output = "output",
}

type ComponentType = RegularComponentType | InputOutputComponentType;

export type NodeDefinitionImpl<TState, TSettings> = {
  style: StyleData;
  nInputs: number;
  nOutputs: number;

  makeState(): TState;
  evaluate(
    state: TState,
    settings: TSettings,
    args: unknown[]
  ): unknown[] | null;
};

function MakeStandardNodeDefinition(
  label: string,
  nInputs: number,
  nOutputs: number,
  func: (args: unknown[]) => unknown[]
): NodeDefinitionImpl<void, void> {
  return {
    style: { style: NodeStyle.Compound, label: label },
    nInputs: nInputs,
    nOutputs: nOutputs,
    makeState: () => {},
    evaluate: (_state: unknown, _settings: unknown, args: unknown[]) =>
      func(args),
  };
}

type ConstantNodeState = {
  hasEvaluated: boolean;
};

const ConstantNodeDefinition: NodeDefinitionImpl<
  ConstantNodeState,
  ConstantNodeSettings
> = {
  style: { style: NodeStyle.Constant },
  nInputs: 0,
  nOutputs: 1,
  makeState: () => {
    return { hasEvaluated: false };
  },
  evaluate: (
    state: ConstantNodeState,
    settings: ConstantNodeSettings,
    _args: unknown[]
  ) => {
    const ret =
      !state.hasEvaluated || settings.repeat ? [settings.value] : null;
    state.hasEvaluated = true;
    return ret;
  },
};

type NodeDefinition = NodeDefinitionImpl<unknown, unknown>;

const typeToDefinitionMap = new Map<RegularComponentType, NodeDefinition>([
  [
    RegularComponentType.Plus,
    MakeStandardNodeDefinition("+", 2, 1, (arr: unknown[]) => {
      Assert(typeof arr[0] === "number" && typeof arr[1] === "number");
      return [arr[0] + arr[1]];
    }),
  ],
  [
    RegularComponentType.Multiply,
    MakeStandardNodeDefinition("x", 2, 1, (arr: unknown[]) => {
      Assert(typeof arr[0] === "number" && typeof arr[1] === "number");
      return [arr[0] * arr[1]];
    }),
  ],
  [
    RegularComponentType.Combine,
    MakeStandardNodeDefinition("combine", 2, 1, (arr: unknown[]) => [arr]),
  ],
  [
    RegularComponentType.Split,
    MakeStandardNodeDefinition("split", 1, 2, (arr: unknown[]) => {
      Assert(arr[0] instanceof Array);
      return arr[0];
    }),
  ],
  [
    RegularComponentType.Nop,
    MakeStandardNodeDefinition("nop", 1, 1, (arr: unknown[]) => arr),
  ],
  [RegularComponentType.Constant, ConstantNodeDefinition],
]);

export function GetNodeDefinition(type: ComponentType): NodeDefinition {
  return getOrThrow(typeToDefinitionMap, type);
}
