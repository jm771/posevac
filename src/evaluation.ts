import {
  CounterAdvanceEvent,
  EvaluationEvent,
  EvaluationListener,
  NodeEvaluateEvent,
  ProgramCounterId,
} from "./evaluation_listeners";
import { ComputeNode, NodeId } from "./nodes";
import { PosFlo, TerminalId } from "./pos_flow";
import { ProgramCounter } from "./program_counter";
import { Assert, DefaultMap } from "./util";

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

class PCStore {
  private programCounters: ProgramCounter[];

  constructor() {
    this.terminalToProgramCounters = new DefaultMap<
      TerminalId,
      ProgramCounter[]
    >(() => new Array<ProgramCounter>());
  }

  Add(pc: ProgramCounter) {}

  Remove(pc: ProgramCounter) {}

  GetById(id: ProgramCounterId): ProgramCounter {}

  GetByTerminal(id: TerminalId): ProgramCounter[] {}

  AdvancePc(pc: ProgramCounter) {
    pc.currentLocation = pc.currentEdge!.dest;
    pc.currentEdge = null;
  }

  GetAll(): ProgramCounter[] {}
}

export class Evaluator {
  // private programCounters: Map<string, ProgramCounter>;
  private programCounters: PCStore;
  // private terminalToProgramCounters: DefaultMap<TerminalId, ProgramCounter[]>;
  private nodeStates: Map<string, unknown>;
  private nodeSettings: Map<NodeId, unknown>;
  private evaluationState: State;
  private posFlo: PosFlo;
  private listener: EvaluationListener;

  constructor(
    posFlo: PosFlo,
    listener: EvaluationListener,
    nodeSettings: Map<NodeId, unknown>
  ) {
    this.programCounters = new PCStore();
    this.evaluationState = { stage: Stage.Evaluate, nodeIndex: 0 };
    this.listener = listener;
    this.posFlo = posFlo;
    this.nodeSettings = nodeSettings;
    this.nodeStates = new Map<string, unknown>();
    posFlo.nodes.forEach((n: ComputeNode) => {
      this.nodeStates.set(n.id, n.definition.makeState());
    });

    // TODO - sensible place?
    this.listener.onEvaluationEvent(EvaluationEvent.Start);
  }

  getCountersForNode(node: ComputeNode): ProgramCounter[] | null {
    const inputCounters = node
      .GetInputTerminals()
      .map((term) => this.programCounters.GetByTerminal(term));

    Assert(inputCounters.every((arr) => arr.length <= 1));
    if (inputCounters.some((arr) => arr.length === 0)) {
      return null;
    }

    return inputCounters.map((arr) => arr[0]);
  }

  isAnyOutputBlocked(node: ComputeNode): boolean {
    return node
      .GetOutputTerminals()
      .map((term) => this.programCounters.GetByTerminal(term))
      .some((arr) => arr.length > 0);
  }

  evaluateNode(node: ComputeNode): void {
    if (this.isAnyOutputBlocked(node)) {
      return;
    }

    const inputCounters = this.getCountersForNode(node);
    if (inputCounters === null) {
      return;
    }

    const inputValues = inputCounters.map((c) => c.contents);

    const result = node.definition.evaluate(
      this.nodeStates.get(node.id),
      this.nodeSettings.get(node.id),
      inputValues
    );

    const newPcs: ProgramCounter[] = [];

    if (result !== null) {
      Assert(result.length === node.definition.nOutputs);

      result.flatMap((val: unknown, idx: number) =>
        this.posFlo
          .GetConnectionsForTerminal(node.GetOutputTerminal(idx))
          .filter((conn) => conn.condition.matches(val))
          .map((conn) => new ProgramCounter(conn.source, conn, val))
      );
    }

    inputCounters.forEach((pc) => {
      this.programCounters.Remove(pc);
    });

    newPcs.forEach((pc) => {
      this.programCounters.Remove(pc);
    });

    const event: NodeEvaluateEvent = {
      nodeId: node.id,
      inputCounters: inputCounters,
      outputCounters: newPcs,
    };

    this.listener.onNodeEvaluate(event);
  }

  advanceCounter(pc: ProgramCounter) {
    if (pc.currentEdge === null) {
      return;
    }

    if (this.programCounters.GetByTerminal(pc.currentEdge.dest).length !== 0) {
      return;
    }

    const event: CounterAdvanceEvent = {
      programCounterId: pc.id,
      startTerminal: pc.currentEdge.source,
      endTerminal: pc.currentEdge.dest,
    };

    this.programCounters.AdvancePc(pc);
    this.listener.onCounterAdvance(event);
  }

  step() {
    switch (this.evaluationState.stage) {
      case Stage.AdvanceCounter: {
        if (
          this.evaluationState.counterIndex >=
          this.evaluationState.counters.length
        ) {
          this.evaluationState = { stage: Stage.Evaluate, nodeIndex: 0 };
        } else {
          this.advanceCounter(
            this.evaluationState.counters[this.evaluationState.counterIndex++]
          );
        }

        break;
      }
      case Stage.Evaluate: {
        if (this.evaluationState.nodeIndex >= this.posFlo.nodes.length) {
          this.evaluationState = {
            stage: Stage.AdvanceCounter,
            counters: Array.from(this.programCounters.GetAll()),
            counterIndex: 0,
          };
        } else {
          this.evaluateNode(
            this.posFlo.nodes[this.evaluationState.nodeIndex++]
          );
        }

        break;
      }
    }
  }

  stride() {
    const startStage = this.evaluationState.stage;

    while (this.evaluationState.stage == startStage) {
      this.step();
    }
  }

  destroy() {
    this.listener.onEvaluationEvent(EvaluationEvent.End);
  }
}
