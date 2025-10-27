import { NodeSingular } from "cytoscape";
import { CompNode } from "./nodes";
import { ProgramCounter } from "./program_counter";
import { DefaultMap } from "./util";

export type CounterAdvanceEvent = {
  programCounterId: string;
  startTerminal: NodeSingular;
  endTerminal: NodeSingular;
};

export type NodeEvaluateEvent = {
  node: NodeSingular;
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

enum Stage {
  AdvanceCounter,
  Evaluate,
}

type State =
  | {
      stage: Stage.AdvanceCounter;
      counters: Array<ProgramCounter>;
      counterIndex: number;
    }
  | { stage: Stage.Evaluate; nodeIndex: number };

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

export class Evaluator {
  private programCounters: Map<string, ProgramCounter>;
  private terminalToProgramCounters: DefaultMap<
    string,
    Map<string, ProgramCounter>
  >;
  private nodeEvaluationState: Map<string, unknown>;
  private state: State;
  private nodes: Array<CompNode>;
  private listener: EvaluationListener;

  constructor(nodes: Array<CompNode>, listener: EvaluationListener) {
    this.programCounters = new Map<string, ProgramCounter>();
    this.state = { stage: Stage.Evaluate, nodeIndex: 0 };
    this.nodeEvaluationState = new Map<string, unknown>();
    this.listener = listener;
    this.terminalToProgramCounters = new DefaultMap<
      string,
      Map<string, ProgramCounter>
    >(() => new Map<string, ProgramCounter>());
    nodes.forEach((n: CompNode) => {
      this.nodeEvaluationState.set(n.getNodeId(), n.makeCleanState());
    });
    this.nodes = nodes;

    // TODO - sensible place?
    this.listener.onEvaluationEvent(EvaluationEvent.Start);
  }

  evaluateNode(node: CompNode): void {
    const evaluation = node.evaluate(
      this.nodeEvaluationState.get(node.getNodeId()),
      this.terminalToProgramCounters
    );

    evaluation.pcsDestroyed.forEach((pc) => {
      this.programCounters.delete(pc.id);
    });
    evaluation.pcsCreated.forEach((pc) => this.programCounters.set(pc.id, pc));

    const event: NodeEvaluateEvent = {
      node: node.node,
      inputCounters: evaluation.pcsDestroyed,
      outputCounters: evaluation.pcsCreated,
    };

    this.listener.onNodeEvaluate(event);
  }

  advanceCounter(pc: ProgramCounter) {
    const startTerminal = pc.currentLocation;
    const nextTerminal = pc.tryAdvance(this.terminalToProgramCounters);

    if (nextTerminal != null) {
      const event: CounterAdvanceEvent = {
        programCounterId: pc.id,
        startTerminal: startTerminal,
        endTerminal: nextTerminal,
      };
      this.listener.onCounterAdvance(event);
    }
  }

  step() {
    switch (this.state.stage) {
      case Stage.AdvanceCounter: {
        if (this.state.counterIndex >= this.state.counters.length) {
          this.state = { stage: Stage.Evaluate, nodeIndex: 0 };
        } else {
          this.advanceCounter(this.state.counters[this.state.counterIndex++]);
        }

        break;
      }
      case Stage.Evaluate: {
        if (this.state.nodeIndex >= this.nodes.length) {
          this.state = {
            stage: Stage.AdvanceCounter,
            counters: Array.from(this.programCounters.values()),
            counterIndex: 0,
          };
        } else {
          this.evaluateNode(this.nodes[this.state.nodeIndex++]);
        }

        break;
      }
    }
  }

  stride() {
    const startStage = this.state.stage;

    while (this.state.stage == startStage) {
      this.step();
    }
  }

  destroy() {
    this.listener.onEvaluationEvent(EvaluationEvent.End);
  }
}
