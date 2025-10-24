import { ProgramCounter } from "./program_counter";
import { CompNode, EvaluateOutput } from "./nodes";
import { GraphEditorContext, LevelContext, Stage } from "./editor_context";
import { NodeSingular } from "cytoscape";

type CounterAdvanceEvent = {
  programCounterId: string;
  startTerminal: NodeSingular;
  endTerminal: NodeSingular;
};

type NodeEvaluateEvent = {
  node: NodeSingular;
  inputCounters: ProgramCounter[];
  outputCounters: ProgramCounter[];
};

enum EvaluationEvent {
  Start,
  End,
}

type CounterAdvanceListener = (e: CounterAdvanceEvent) => void;
type NodeEvaluateListener = (e: NodeEvaluateEvent) => void;
type EvaluationEventListener = (e: EvaluationEvent) => void;

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

export class Evaluator {
  private programCounters: Map<string, ProgramCounter>;
  private state: State;
  private nodeEvaluationState: Map<string, any>;
  private listeners: Map<number, EvaluationListener> = new Map<
    number,
    EvaluationListener
  >();
  private currentListenerId: number = 0;
  private nodes: Array<CompNode>;

  registerListener(l: EvaluationListener): number {
    const id = this.currentListenerId++;
    this.listeners.set(id, l);
    return id;
  }

  deregisterListener(id: number) {
    this.listeners.delete(id);
  }

  constructor(nodes: Array<CompNode>) {
    this.programCounters = new Map<string, ProgramCounter>();
    this.state = { stage: Stage.Evaluate, nodeIndex: 0 };
    this.nodeEvaluationState = new Map<string, any>();
    nodes.forEach((n: CompNode) => {
      this.nodeEvaluationState.set(n.getNodeId(), n.makeCleanState());
    });
    this.nodes = nodes;
  }

  evaluateNode(node: CompNode): void {
    const evaluation = node.evaluate(
      this.nodeEvaluationState.get(node.getNodeId())
    );

    evaluation.pcsDestroyed.forEach((pc) => this.programCounters.delete(pc.id));
    evaluation.pcsCreated.forEach((pc) => this.programCounters.set(pc.id, pc));

    const event: NodeEvaluateEvent = {
      node: node.node,
      inputCounters: evaluation.pcsDestroyed,
      outputCounters: evaluation.pcsCreated,
    };

    this.listeners.forEach((l) => l.onNodeEvaluate(event));
  }

  advanceCounter(pc: ProgramCounter) {
    const startTerminal = pc.currentLocation;
    const nextTerminal = pc.tryAdvance();

    if (nextTerminal != null) {
      const event: CounterAdvanceEvent = {
        programCounterId: pc.id,
        startTerminal: startTerminal,
        endTerminal: nextTerminal,
      };
      this.listeners.forEach((l) => l.onCounterAdvance(event));
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
        if (this.state.nodeIndex >= this.programCounters.size) {
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
    this.listeners.forEach((v, _) => v.onEvaluationEvent(EvaluationEvent.End));
  }
}
