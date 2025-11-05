import { CollectionData, NodeDefinition, NodeSingular } from "cytoscape";
import { NodeBuildContext } from "./editor_context";
import { ProgramCounter } from "./program_counter";
import { Assert, DefaultMap, getOrThrow } from "./util";

export class EvaluateOutput {
  pcsDestroyed: Array<ProgramCounter>;
  pcsCreated: Array<ProgramCounter>;

  constructor(
    pcsDestroyed: Array<ProgramCounter>,
    pcsCreated: Array<ProgramCounter>
  ) {
    this.pcsCreated = pcsCreated;
    this.pcsDestroyed = pcsDestroyed;
  }
}

export interface TestValuesContext {
  getInputProvider(): InputProvider;
  getOutputChecker(): OutputChecker;
}

export interface InputProvider {
  getInput(index: number): unknown | null;
}

export interface OutputChecker {
  checkOutput(index: number, val: unknown): void;
}

export type ComputeNode = NodeDefinition & {
  nodeId: string;
};

class CompNodeInternal<TState> {
  inputTerminals: NodeSingular[];
  outputTerminals: NodeSingular[];
  invisibleTerminals: NodeSingular[];
  node: NodeSingular;
  func: NodeFunction<TState>;
  deletable: boolean;

  constructor(
    func: NodeFunction<TState>,
    node: NodeSingular,
    inputTerminals: NodeSingular[],
    outputTerminals: NodeSingular[],
    invisibleTerminals: NodeSingular[],
    deletable: boolean
  ) {
    this.inputTerminals = inputTerminals;
    this.outputTerminals = outputTerminals;
    this.invisibleTerminals = invisibleTerminals;
    this.node = node;
    this.func = func;
    this.deletable = deletable;
  }

  getNodeId(): string {
    return this.node.id();
  }

  makeCleanState(): unknown {
    return this.func.makeState();
  }

  destroy() {
    this.inputTerminals.forEach((n) => n.remove());
    this.outputTerminals.forEach((n) => n.remove());
    this.invisibleTerminals.forEach((n) => n.remove());
    this.node.remove();
  }

  evaluate(
    nodeEvaluationState: TState,
    terminalToProgramCounters: DefaultMap<string, Map<string, ProgramCounter>>
  ): EvaluateOutput {
    for (const term of this.outputTerminals) {
      if (terminalToProgramCounters.get(term.id()).size != 0) {
        return new EvaluateOutput([], []);
      }
    }

    for (const term of this.inputTerminals) {
      if (terminalToProgramCounters.get(term.id()).size > 1) {
        throw Error("More than one program counter at input");
      }
      if (terminalToProgramCounters.get(term.id()).size == 0) {
        return new EvaluateOutput([], []);
      }
    }

    const funcArgs = this.inputTerminals.map(
      (t) =>
        terminalToProgramCounters.get(t.id()).values().next().value?.contents
    );
    const result = this.func.evaluate(nodeEvaluationState, this.node, funcArgs);
    const newPcs: Array<ProgramCounter> = [];

    if (result != undefined) {
      let resultArray: unknown[];

      if (this.outputTerminals.length == 1) {
        resultArray = [result];
      } else {
        resultArray = result as Array<unknown>;
      }
      if (this.outputTerminals.length != resultArray.length) {
        throw Error("N out terminals didn't match result length");
      }

      for (let i = 0; i < resultArray.length; i++) {
        const edges = this.outputTerminals[i].edgesTo("").toArray();
        const filteredEdges = edges.filter((edge) => {
          const condition = edge.data("condition");
          return condition.matches(resultArray[i]);
        });

        for (const edge of filteredEdges) {
          const newPc = new ProgramCounter(
            this.outputTerminals[i],
            edge,
            resultArray[i]
          );
          terminalToProgramCounters
            .get(this.outputTerminals[i].id())
            .set(newPc.id, newPc);
          newPcs.push(newPc);
        }
      }
    }

    const rmedPcs: Array<ProgramCounter> = [];
    this.inputTerminals.forEach((term) => {
      const termPcs = terminalToProgramCounters.get(term.id());

      rmedPcs.push(termPcs.values().next().value as ProgramCounter);
      termPcs.clear();
    });

    return new EvaluateOutput(rmedPcs, newPcs);
  }
}

export const CompNode = CompNodeInternal<unknown>;
export type CompNode = CompNodeInternal<unknown>;

export function createNodeFromName(
  context: NodeBuildContext,
  type: ComponentType,
  x: number,
  y: number
): CompNode {
  return getOrThrow(COMPONENT_REGISTRY, type)(context, x, y);
}
