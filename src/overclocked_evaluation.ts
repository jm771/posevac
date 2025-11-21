import { Node } from "@xyflow/react";
import {
  EcsComponent,
  EntityComponents,
  OverclockMode,
} from "./contexts/ecs_context";
import { Evaluator } from "./evaluation";
import {
  CounterAdvanceEvent,
  EvaluationEvent,
  EvaluationListener,
  NodeEvaluateEvent,
} from "./evaluation_listeners";
import { NodeDefinition } from "./node_definitions";
import {
  ComputeNode,
  GetInputTerminals,
  GetOutputTerminal,
  GetOutputTerminals,
  TestValuesContext,
} from "./nodes";
import { PosFlo } from "./pos_flow";
import { PCStore, ProgramCounter } from "./program_counter";
import { Assert, mapIterable, NotNull, range } from "./util";

function* getAllCombs(arr: unknown[][]): Generator<unknown[]> {
  if (arr.length === 0) {
    yield [];
    return;
  }
  if (arr.length === 1) {
    for (const el of arr[0]) {
      yield [el];
    }

    return;
  }

  const last = NotNull(arr.pop());

  for (const rest of getAllCombs(arr)) {
    for (const el of last) {
      yield rest.concat([el]);
    }
  }
}

function getMappedInputs(
  inputValueses: unknown[][],
  mode: OverclockMode
): unknown[][] | null {
  if (inputValueses.length === 0) {
    return [[]];
  }

  if (mode === OverclockMode.Regular) {
    Assert(inputValueses.every((arr) => arr.length === 1));
    return [inputValueses.map((arr) => arr[0])];
  } else if (mode === OverclockMode.Cartesian) {
    return Array.from(getAllCombs(inputValueses));
  } else {
    //if (mode === OverclockMode.Zip) {
    const firstLen = inputValueses[0].length;
    if (!inputValueses.every((arr) => arr.length === firstLen)) {
      return null;
    }
    return range(firstLen).map((idx) => inputValueses.map((arr) => arr[idx]));
  }
}

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

export class OverclockedEvaluator implements Evaluator {
  private programCounters: PCStore;
  private nodeStates: Map<string, unknown>;
  private evaluationState: State;
  private posFlo: PosFlo;
  private listener: EvaluationListener;
  private testValues: TestValuesContext;
  private ecs: EntityComponents;

  constructor(
    posFlo: PosFlo,
    listener: EvaluationListener,
    testValues: TestValuesContext,
    ecs: EntityComponents
  ) {
    this.programCounters = new PCStore();
    this.evaluationState = { stage: Stage.Evaluate, nodeIndex: 0 };
    this.listener = listener;
    this.posFlo = posFlo;
    this.testValues = testValues;
    this.nodeStates = new Map<string, unknown>();
    this.ecs = ecs;
    posFlo.nodes.forEach((n: Node<NodeDefinition>) => {
      this.nodeStates.set(n.id, n.data.makeState());
    });

    // TODO - sensible place?
    this.listener.onEvaluationEvent(EvaluationEvent.Start);
  }

  getCountersForNode(node: ComputeNode): ProgramCounter[][] | null {
    const inputCounters = GetInputTerminals(node).map((term) =>
      this.programCounters.GetByTerminal(term)
    );

    if (inputCounters.some((arr) => arr.length === 0)) {
      return null;
    }

    return inputCounters;
  }

  // TODO remove this safety too?
  isAnyOutputBlocked(node: ComputeNode): boolean {
    return GetOutputTerminals(node)
      .map((term) => this.programCounters.GetByTerminal(term))
      .some((arr) => arr.length > 0);
  }

  evaluateNode(node: Node<NodeDefinition>): void {
    if (this.isAnyOutputBlocked(node)) {
      return;
    }

    const inputCounters = this.getCountersForNode(node);
    if (inputCounters === null) {
      return;
    }

    const inputValueses = inputCounters.map((a) => a.map((c) => c.contents));

    const ocMode = this.ecs.GetComponent(node.id, EcsComponent.Overclock).mode;

    const mappedInputValues = getMappedInputs(inputValueses, ocMode);

    if (mappedInputValues === null) {
      return;
    }

    const results = mapIterable(mappedInputValues, (inputValues) =>
      node.data.evaluate(
        this.nodeStates.get(node.id),
        this.posFlo.nodeSettings.get(node.id)?.setting,
        inputValues,
        this.testValues
      )
    );

    let newPcs: ProgramCounter[] = [];

    for (const result of results) {
      if (result !== null) {
        Assert(result.length === node.data.nOutputs);

        newPcs = newPcs.concat(
          result.flatMap((val: unknown, idx: number) =>
            this.posFlo
              .GetConnectionsForTerminal(GetOutputTerminal(node, idx))
              .filter((conn) => conn.condition.matches(val))
              .map((conn) => new ProgramCounter(conn.source, conn, val))
          )
        );
      }
    }

    const flatCounters = inputCounters.flatMap((pc) => pc);

    flatCounters.forEach((pc) => {
      this.programCounters.Remove(pc);
    });

    newPcs.forEach((pc) => {
      this.programCounters.Add(pc);
    });

    const event: NodeEvaluateEvent = {
      nodeId: node.id,
      inputCounters: flatCounters,
      outputCounters: newPcs,
    };

    this.listener.onNodeEvaluate(event);
  }

  advanceCounter(pc: ProgramCounter) {
    if (pc.currentEdge === null) {
      return;
    }

    // Stack them up baby!!!
    const destNodeId = pc.currentEdge.dest.nodeId;

    const blocking =
      this.ecs.GetComponent(destNodeId, EcsComponent.Overclock).mode ===
        OverclockMode.Regular ||
      this.ecs.GetComponent(pc.currentLocation.nodeId, EcsComponent.Overclock)
        .mode === OverclockMode.Regular;

    if (
      blocking &&
      this.programCounters.GetByTerminal(pc.currentEdge.dest).length !== 0
    ) {
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

    while (this.evaluationState.stage === startStage) {
      this.step();
    }
  }

  destroy() {
    this.listener.onEvaluationEvent(EvaluationEvent.End);
  }
}
