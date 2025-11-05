import { NodeId } from "./nodes";
import { TerminalId } from "./pos_flow";
import { ProgramCounter, ProgramCounterId } from "./program_counter";

export type CounterAdvanceEvent = {
  programCounterId: ProgramCounterId;
  startTerminal: TerminalId;
  endTerminal: TerminalId;
};

export type NodeEvaluateEvent = {
  nodeId: NodeId;
  inputCounters: ProgramCounter[];
  outputCounters: ProgramCounter[];
};

export enum EvaluationEvent {
  Start,
  End,
}

export type CounterAdvanceListener = (e: CounterAdvanceEvent) => void;
export type NodeEvaluateListener = (e: NodeEvaluateEvent) => void;
export type EvaluationEventListener = (e: EvaluationEvent) => void;

export type EvaluationListener = {
  onCounterAdvance: CounterAdvanceListener;
  onNodeEvaluate: NodeEvaluateListener;
  onEvaluationEvent: EvaluationEventListener;
};

export interface EvaluationEventSource {
  registerListener(l: EvaluationListener): number;
  deregisterListener(id: number): void;
}

export class EvaluationListenerHolder
  implements EvaluationEventSource, EvaluationListener
{
  onCounterAdvance(e: CounterAdvanceEvent) {
    this.listeners.forEach((l) => l.onCounterAdvance(e));
  }

  onNodeEvaluate(e: NodeEvaluateEvent) {
    this.listeners.forEach((l) => l.onNodeEvaluate(e));
  }

  onEvaluationEvent(e: EvaluationEvent) {
    this.listeners.forEach((l) => l.onEvaluationEvent(e));
  }

  private listeners: Map<number, EvaluationListener> = new Map<
    number,
    EvaluationListener
  >();
  private currentListenerId: number = 0;

  registerListener(l: EvaluationListener): number {
    const id = this.currentListenerId++;
    this.listeners.set(id, l);
    return id;
  }

  deregisterListener(id: number) {
    this.listeners.delete(id);
  }
}
