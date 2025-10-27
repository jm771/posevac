import React, { useEffect, useState } from "react";
import {
  CounterAdvanceEvent,
  EvaluationEvent,
  EvaluationEventSource,
  EvaluationListener,
  NodeEvaluateEvent,
} from "../evaluation";
import { ProgramCounter } from "../program_counter";
import { mapIterable } from "../util";
import { ProgramCounterComponent } from "./ProgramCounterComponent";

export function ProgramCounterOverlay({
  evaluationEventSource,
}: {
  evaluationEventSource: EvaluationEventSource;
}) {
  const [programCounters, setProgramCounters] = useState<
    Map<string, ProgramCounter>
  >(new Map<string, ProgramCounter>());

  useEffect(() => {
    const evaluationListenerCallbacks: EvaluationListener = {
      onCounterAdvance: (e: CounterAdvanceEvent) => {
        setProgramCounters((pcs) => {
          const newProgramCounters = new Map(pcs);
          // this is mutating the original object but it's... ok
          newProgramCounters.get(e.programCounterId)!.currentLocation =
            e.endTerminal;

          return newProgramCounters;
        });
      },
      onNodeEvaluate: (e: NodeEvaluateEvent) => {
        setProgramCounters((pcs) => {
          const newProgramCounters: Map<string, ProgramCounter> = new Map(pcs);
          e.inputCounters.forEach((pc) => newProgramCounters.delete(pc.id));
          e.outputCounters.forEach((pc) => newProgramCounters.set(pc.id, pc));
          return newProgramCounters;
        });
      },
      onEvaluationEvent: (e: EvaluationEvent) => {
        if (e == EvaluationEvent.Start) {
          setProgramCounters(new Map<string, ProgramCounter>());
        }
        if (e == EvaluationEvent.End) {
          setProgramCounters(new Map<string, ProgramCounter>());
        }
      },
    };

    const evaluationRegistration = evaluationEventSource.registerListener(
      evaluationListenerCallbacks
    );

    return () => {
      evaluationEventSource.deregisterListener(evaluationRegistration);
    };
  }, [evaluationEventSource]);

  return (
    <>
      {mapIterable(programCounters.values(), (pc: ProgramCounter) => (
        <ProgramCounterComponent
          key={pc.id}
          position={pc.currentLocation.position()}
          text={String(pc.contents)}
          angle={0}
        />
      ))}
    </>
  );
}
