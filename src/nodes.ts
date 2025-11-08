import { Node } from "@xyflow/react";
import { NodeDefinition } from "./node_definitions";
import { TerminalId, TerminalType } from "./pos_flow";
import { ProgramCounter } from "./program_counter";
import { range } from "./util";

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

export type NodeId = string;

// export function TryGetNodeInputs(
//   posFlo: PosFlo
//   terminalToProgramCounters: Map<TerminalId, ProgramCounter>
// ): unknown[] | null {

// }

// export class ComputeNode {
//   definition: NodeDefinition;
//   id: NodeId;

//   constructor(nodeDefinition: NodeDefinition, id: NodeId) {
//     this.definition = nodeDefinition;
//     this.id = id;
//   }

export type ComputeNode = Node<NodeDefinition>;

export function GetInputTerminals(node: Node<NodeDefinition>): TerminalId[] {
  return range(node.data.nInputs).map((idx) => {
    return { type: TerminalType.Input, nodeId: node.id, terminalIndex: idx };
  });
}

export function GetOutputTerminals(node: Node<NodeDefinition>): TerminalId[] {
  return range(node.data.nOutputs).map((idx) => {
    return { type: TerminalType.Output, nodeId: node.id, terminalIndex: idx };
  });
}

export function GetOutputTerminal(
  node: Node<NodeDefinition>,
  idx: number
): TerminalId {
  return { type: TerminalType.Output, nodeId: node.id, terminalIndex: idx };
}
