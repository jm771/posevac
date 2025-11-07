import { NodeDefinitionImpl, NodeStyle } from "./node_definitions";
import { TestValuesContext } from "./nodes";

export function MakeInputNode(
  index: number,
  valuesContext: TestValuesContext
): NodeDefinitionImpl<void, void> {
  return {
    style: { style: NodeStyle.Constant },
    nInputs: 0,
    nOutputs: 1,
    deletable: false,
    makeState: () => {
      return { index: 0 };
    },
    evaluate: (_state: void, _settings: void, _args: unknown[]) => {
      const ret = valuesContext.getInputProvider().getInput(index);
      return ret === null ? null : [ret];
    },
  };
}

export function MakeOutputNode(
  index: number,
  valuesContext: TestValuesContext
): NodeDefinitionImpl<void, void> {
  return {
    style: { style: NodeStyle.Constant },
    nInputs: 1,
    nOutputs: 0,
    deletable: false,
    makeState: () => {
      return { index: 0 };
    },
    evaluate: (_state: void, _settings: void, args: unknown[]) => {
      valuesContext.getOutputChecker().checkOutput(index, args[0]);
      return [];
    },
  };
}
