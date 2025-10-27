import { CollectionData, Core, NodeSingular } from "cytoscape";
import { NodeBuildContext } from "./editor_context";
import { ProgramCounter } from "./program_counter";
import { DefaultMap, getOrThrow } from "./util";

export type ComponentType =
  | "input"
  | "output"
  | "plus"
  | "multiply"
  | "combine"
  | "split"
  | "nop"
  | "constant";

// Honestly this should not exist - will remove later
export type NodeStyle = "compound" | "input" | "output" | "constant";

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

interface NodeFunction {
  makeState(): unknown;
  evaluate(
    state: unknown,
    nodedata: CollectionData,
    args: Array<unknown>
  ): unknown;
}

class PureNodeFunction implements NodeFunction {
  private func: Function;

  constructor(func: Function) {
    this.func = func;
  }

  makeState() {
    return null;
  }

  evaluate(_: unknown, __: CollectionData, args: Array<unknown>) {
    return this.func(...args);
  }
}

export interface InputProvider {
  getInput(index: number): unknown | null;
}

export interface OutputChecker {
  checkOutput(index: number, val: unknown): void;
}

class InputNodeFunction implements NodeFunction {
  private inputs: Array<unknown>;

  constructor(inputs: Array<unknown>) {
    this.inputs = inputs;
  }

  makeState() {
    return { i: 0 };
  }

  evaluate(state: unknown, _: CollectionData, __: Array<unknown>) {
    if (state.i < this.inputs.length) {
      return this.inputs[state.i++];
    } else {
      return null;
    }
  }
}

class OutputNodeFunction implements NodeFunction {
  private outputs: Array<unknown>;

  constructor(outputs: Array<unknown>) {
    this.outputs = outputs;
  }

  makeState() {
    return { i: 0 };
  }

  evaluate(state: unknown, _: CollectionData, args: Array<unknown>) {
    if (state.i < this.outputs.length) {
      console.log(
        "expected: ",
        this.outputs[state.i],
        "actual: ",
        args[0],
        "match: ",
        this.outputs[state.i] === args[0]
      );
      state.i++;
    } else {
      console.log("Got more outputs than expected");
    }
  }
}

class ConstantNodeFunction implements NodeFunction {
  makeState() {
    return { triggered: false };
  }

  evaluate(state: unknown, nodeData: CollectionData, _: Array<unknown>) {
    if (nodeData.data("constantRepeat")) {
      return nodeData.data("constantValue");
    } else if (!state.triggered) {
      state.triggered = true;
      return nodeData.data("constantValue");
    } else return undefined;
  }
}

function makeTerminals(
  cy: Core,
  nodeId: string,
  x: number,
  y: number,
  n: number,
  type: string
): NodeSingular[][] {
  if (n == 0) {
    return [[], makeTerminals(cy, nodeId, x, y, 1, "invisible")[0]];
  }

  const minY = -60;
  const maxY = 60;
  const terminals: NodeSingular[] = [];

  for (let i = 0; i < n; i++) {
    const terminalId = `${nodeId}-${type}${i}`;
    const yOffset = ((i + 1.0) * (maxY - minY)) / (n + 1.0) + minY;
    cy.add({
      group: "nodes",
      data: {
        id: terminalId,
        parent: nodeId,
        style: `${type}-terminal`,
        terminalType: type,
      },
      position: { x: x, y: y + yOffset },
    });

    const terminal = cy.$(`#${terminalId}`) as NodeSingular;
    terminal.ungrabify();
    terminals.push(terminal);
  }

  return [terminals, []];
}

function makeInputTerminals(
  cy: Core,
  nodeId: string,
  x: number,
  y: number,
  n: number
): NodeSingular[][] {
  return makeTerminals(cy, nodeId, x - 50, y, n, "input");
}

function makeOutputTerminals(
  cy: Core,
  nodeId: string,
  x: number,
  y: number,
  n: number
): NodeSingular[][] {
  return makeTerminals(cy, nodeId, x + 50, y, n, "output");
}

export class CompNode {
  inputTerminals: NodeSingular[];
  outputTerminals: NodeSingular[];
  invisibleTerminals: NodeSingular[];
  node: NodeSingular;
  func: NodeFunction;
  deletable: boolean;

  constructor(
    func: NodeFunction,
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
    nodeEvaluationState: unknown,
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
      let resultArray;

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
          if (edge.data("condition") === "") {
            return true;
          }
          const conditionFunc = eval(edge.data("condition"));
          return conditionFunc(resultArray[i]);
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

function createNode(
  context: NodeBuildContext,
  x: number,
  y: number,
  type: ComponentType,
  label: string,
  style: NodeStyle,
  inTerminals: number,
  outTerminals: number,
  func: NodeFunction,
  extraData: { [key: string]: unknown } = {}
): CompNode {
  const nodeId = `node-${context.nodeIdCounter++}`;
  context.cy.add({
    group: "nodes",
    data: {
      id: nodeId,
      label: label,
      type: type,
      style: style,
      ...extraData,
    },
    position: { x, y },
  });

  const node = context.cy.$(`#${nodeId}`) as NodeSingular;

  const [inputTerminals, invisibleIn] = makeInputTerminals(
    context.cy,
    nodeId,
    x,
    y,
    inTerminals
  );
  const [outputTerminals, invisibleOut] = makeOutputTerminals(
    context.cy,
    nodeId,
    x,
    y,
    outTerminals
  );

  const isDeleteable = !(style == "input" || style == "output");

  return new CompNode(
    func,
    node,
    inputTerminals,
    outputTerminals,
    invisibleIn.concat(invisibleOut),
    isDeleteable
  );
}

export function createInputNode(
  context: NodeBuildContext,
  x: number,
  y: number,
  inputs: Array<unknown>
): CompNode {
  return createNode(
    context,
    x,
    y,
    "input",
    "input",
    "input",
    0,
    1,
    new InputNodeFunction(inputs)
  );
}

export function createOutputNode(
  context: NodeBuildContext,
  x: number,
  y: number,
  outputs: Array<unknown>
): CompNode {
  return createNode(
    context,
    x,
    y,
    "output",
    "output",
    "output",
    1,
    0,
    new OutputNodeFunction(outputs)
  );
}

export function createPlusNode(
  context: NodeBuildContext,
  x: number,
  y: number
): CompNode {
  return createNode(
    context,
    x,
    y,
    "plus",
    "+",
    "compound",
    2,
    1,
    new PureNodeFunction((a: unknown, b: unknown) => a + b)
  );
}

export function createMultiplyNode(
  context: NodeBuildContext,
  x: number,
  y: number
): CompNode {
  return createNode(
    context,
    x,
    y,
    "multiply",
    "×",
    "compound",
    2,
    1,
    new PureNodeFunction((a: unknown, b: unknown) => a * b)
  );
}

export function createCombineNode(
  context: NodeBuildContext,
  x: number,
  y: number
): CompNode {
  return createNode(
    context,
    x,
    y,
    "combine",
    "combine",
    "compound",
    2,
    1,
    new PureNodeFunction((a: unknown, b: unknown) => [a, b])
  );
}

export function createSplitNode(
  context: NodeBuildContext,
  x: number,
  y: number
): CompNode {
  return createNode(
    context,
    x,
    y,
    "split",
    "split",
    "compound",
    1,
    2,
    new PureNodeFunction((a: unknown) => a)
  );
}

export function createNopNode(
  context: NodeBuildContext,
  x: number,
  y: number
): CompNode {
  return createNode(
    context,
    x,
    y,
    "plus",
    "+",
    "compound",
    1,
    1,
    new PureNodeFunction((a: unknown) => a)
  );
}

export function createConstantNode(
  context: NodeBuildContext,
  x: number,
  y: number,
  initialValue: unknown = 0,
  initialRepeat: boolean = true
): CompNode {
  return createNode(
    context,
    x,
    y,
    "constant",
    "const",
    "constant",
    0,
    1,
    new ConstantNodeFunction(),
    { constantValue: initialValue, constantRepeat: initialRepeat }
  );
}

export const COMPONENT_REGISTRY: Map<
  ComponentType,
  (context: NodeBuildContext, x: number, y: number) => CompNode
> = new Map([
  ["plus", createPlusNode],
  ["multiply", createMultiplyNode],
  ["combine", createCombineNode],
  ["split", createSplitNode],
  ["nop", createNopNode],
  ["constant", createConstantNode],
]);

export function createNodeFromName(
  context: NodeBuildContext,
  type: ComponentType,
  x: number,
  y: number
): CompNode {
  return getOrThrow(COMPONENT_REGISTRY, type)(context, x, y);
}
