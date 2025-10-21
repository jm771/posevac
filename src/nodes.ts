import { CollectionData, Core, NodeSingular } from "cytoscape";
import { ProgramCounter } from "./program_counter";
import { NodeBuildContext } from "./editor_context";

export type ComponentType =
  | "input"
  | "output"
  | "plus"
  | "multiply"
  | "combine"
  | "split"
  | "nop"
  | "constant";

export class EvaluateOutput {
  pcsDestroyed: Array<ProgramCounter>;
  pcsCreated: Array<ProgramCounter>;

  constructor(
    pcsDestroyed: Array<ProgramCounter>,
    pcsCreated: Array<ProgramCounter>,
  ) {
    this.pcsCreated = pcsCreated;
    this.pcsDestroyed = pcsDestroyed;
  }
}

interface NodeFunction {
  makeState(): any;
  evaluate(state: any, nodedata: CollectionData, args: Array<any>): any;
}

class PureNodeFunction implements NodeFunction {
  private func: Function;

  constructor(func: Function) {
    this.func = func;
  }

  makeState() {
    return null;
  }

  evaluate(_: any, __: CollectionData, args: Array<any>) {
    return this.func(...args);
  }
}

class InputNodeFunction implements NodeFunction {
  private inputs: Array<any>;

  constructor(inputs: Array<any>) {
    this.inputs = inputs;
  }

  makeState() {
    return { i: 0 };
  }

  evaluate(state: any, _: CollectionData, __: Array<any>) {
    if (state.i < this.inputs.length) {
      return this.inputs[state.i++];
    } else {
      return null;
    }
  }
}

class OutputNodeFunction implements NodeFunction {
  private outputs: Array<any>;

  constructor(outputs: Array<any>) {
    this.outputs = outputs;
  }

  makeState() {
    return { i: 0 };
  }

  evaluate(state: any, _: CollectionData, args: Array<any>) {
    if (state.i < this.outputs.length) {
      console.log(
        "expected: ",
        this.outputs[state.i],
        "actual: ",
        args[0],
        "match: ",
        this.outputs[state.i] === args[0],
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

  evaluate(state: any, nodeData: CollectionData, _: Array<any>) {
    if (nodeData.data("constantRepeat")) {
      return nodeData.data("constantValue");
    } else if (!state.triggered) {
      state.triggered = true;
      return nodeData.data("constantValue");
    } else return undefined;
  }
}

export function getTerminalProgramCounters(
  terminal: NodeSingular,
): Map<string, ProgramCounter> {
  return terminal.data("program_counters");
}

function makeTerminals(
  cy: Core,
  nodeId: string,
  x: number,
  y: number,
  n: number,
  type: string,
): NodeSingular[] {
  if (n == 0) {
    // Warning - this is "leaked" - probably fine?
    makeTerminals(cy, nodeId, x, y, 1, "invisible");
    return [];
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
        type: `${type}-terminal`,
        terminalType: type,
        program_counters: new Map<string, ProgramCounter>(),
      },
      position: { x: x, y: y + yOffset },
    });

    const terminal = cy.$(`#${terminalId}`) as NodeSingular;
    terminal.ungrabify();
    terminals.push(terminal);
  }

  return terminals;
}

function makeInputTerminals(
  cy: Core,
  nodeId: string,
  x: number,
  y: number,
  n: number,
): NodeSingular[] {
  return makeTerminals(cy, nodeId, x - 50, y, n, "input");
}

function makeOutputTerminals(
  cy: Core,
  nodeId: string,
  x: number,
  y: number,
  n: number,
): NodeSingular[] {
  return makeTerminals(cy, nodeId, x + 50, y, n, "output");
}

export class CompNode {
  inputTerminals: NodeSingular[];
  outputTerminals: NodeSingular[];
  node: NodeSingular;
  func: NodeFunction;

  constructor(
    func: NodeFunction,
    node: NodeSingular,
    inputTerminals: NodeSingular[],
    outputTerminals: NodeSingular[],
  ) {
    this.inputTerminals = inputTerminals;
    this.outputTerminals = outputTerminals;
    this.node = node;
    this.func = func;
  }

  getNodeId(): string {
    return this.node.id();
  }

  makeCleanState(): any {
    return this.func.makeState();
  }

  evaluate(nodeAnimationState: any): EvaluateOutput {
    for (const term of this.outputTerminals) {
      if (getTerminalProgramCounters(term).size != 0) {
        return new EvaluateOutput([], []);
      }
    }

    for (const term of this.inputTerminals) {
      if (getTerminalProgramCounters(term).size > 1) {
        throw Error("More than one program counter at input");
      }
      if (getTerminalProgramCounters(term).size == 0) {
        return new EvaluateOutput([], []);
      }
    }

    const funcArgs = this.inputTerminals.map(
      (t) => getTerminalProgramCounters(t).values().next().value?.contents,
    );
    const result = this.func.evaluate(nodeAnimationState, this.node, funcArgs);
    let newPcs: Array<ProgramCounter> = [];

    if (result != undefined) {
      let resultArray;

      if (this.outputTerminals.length == 1) {
        resultArray = [result];
      } else {
        resultArray = result as Array<any>;
      }
      if (this.outputTerminals.length != resultArray.length) {
        throw Error("N out terminals didn't match result length");
      }

      for (let i = 0; i < resultArray.length; i++) {
        // TODO - does this work?
        const edges = this.outputTerminals[i].edgesTo("").toArray();
        // const edges =  cy.edges(`[source="${this.outputTerminals[i].id()}"]`).toArray()
        const filteredEdges = edges.filter((edge) => {
          if (edge.data("condition") === "") {
            return true;
          }
          const conditionFunc = eval(edge.data("condition"));
          return conditionFunc(resultArray[i]);
        });

        for (let edge of filteredEdges) {
          let newPc = new ProgramCounter(
            this.outputTerminals[i],
            edge,
            resultArray[i],
          );
          getTerminalProgramCounters(this.outputTerminals[i]).set(
            newPc.id,
            newPc,
          );
          newPcs.push(newPc);
        }
      }
    }

    let rmedPcs: Array<ProgramCounter> = [];
    this.inputTerminals.forEach((term) => {
      rmedPcs.push(
        getTerminalProgramCounters(term).values().next()
          .value as ProgramCounter,
      );
      getTerminalProgramCounters(term).clear();
    });

    return new EvaluateOutput(rmedPcs, newPcs);
  }
}

function createNode(
  context: NodeBuildContext,
  x: number,
  y: number,
  label: string,
  type: string,
  inTerminals: number,
  outTerminals: number,
  func: NodeFunction,
): CompNode {
  const nodeId = `node-${context.nodeIdCounter++}`;
  context.cy.add({
    group: "nodes",
    data: {
      id: nodeId,
      label: label,
      type: type,
    },
    position: { x, y },
  });

  const node = context.cy.$(`#${nodeId}`) as NodeSingular;

  const inputTerminals = makeInputTerminals(
    context.cy,
    nodeId,
    x,
    y,
    inTerminals,
  );
  const outputTerminals = makeOutputTerminals(
    context.cy,
    nodeId,
    x,
    y,
    outTerminals,
  );

  return new CompNode(func, node, inputTerminals, outputTerminals);
}

export function createInputNode(
  context: NodeBuildContext,
  x: number,
  y: number,
  inputs: Array<any>,
): CompNode {
  return createNode(
    context,
    x,
    y,
    "input",
    "input",
    0,
    1,
    new InputNodeFunction(inputs),
  );
}

export function createOutputNode(
  context: NodeBuildContext,
  x: number,
  y: number,
  outputs: Array<any>,
): CompNode {
  return createNode(
    context,
    x,
    y,
    "output",
    "output",
    1,
    0,
    new OutputNodeFunction(outputs),
  );
}

export function createPlusNode(
  context: NodeBuildContext,
  x: number,
  y: number,
): CompNode {
  return createNode(
    context,
    x,
    y,
    "+",
    "compound",
    2,
    1,
    new PureNodeFunction((a: any, b: any) => a + b),
  );
}

export function createMultiplyNode(
  context: NodeBuildContext,
  x: number,
  y: number,
): CompNode {
  return createNode(
    context,
    x,
    y,
    "×",
    "compound",
    2,
    1,
    new PureNodeFunction((a: any, b: any) => a * b),
  );
}

export function createCombineNode(
  context: NodeBuildContext,
  x: number,
  y: number,
): CompNode {
  return createNode(
    context,
    x,
    y,
    "combine",
    "compound",
    2,
    1,
    new PureNodeFunction((a: any, b: any) => [a, b]),
  );
}

export function createSplitNode(
  context: NodeBuildContext,
  x: number,
  y: number,
): CompNode {
  return createNode(
    context,
    x,
    y,
    "split",
    "compound",
    1,
    2,
    new PureNodeFunction((a: any) => a),
  );
}

export function createNopNode(
  context: NodeBuildContext,
  x: number,
  y: number,
): CompNode {
  return createNode(
    context,
    x,
    y,
    "+",
    "compound",
    1,
    1,
    new PureNodeFunction((a: any) => a),
  );
}

export function createConstantNode(
  context: NodeBuildContext,
  x: number,
  y: number,
  initialValue: any = 0,
  initialRepeat: boolean = true,
): CompNode {
  const nodeId = `node-${context.nodeIdCounter++}`;
  context.cy.add({
    group: "nodes",
    data: {
      id: nodeId,
      label: "const",
      type: "constant",
      constantValue: initialValue,
      constantRepeat: initialRepeat,
    },
    position: { x, y },
  });

  const node = context.cy.$(`#${nodeId}`) as NodeSingular;

  const inputTerminals = makeInputTerminals(context.cy, nodeId, x, y, 0);
  const outputTerminals = makeOutputTerminals(context.cy, nodeId, x, y, 1);

  return new CompNode(
    new ConstantNodeFunction(),
    node,
    inputTerminals,
    outputTerminals,
  );
}
