import { AnimatePresence, motion } from "framer-motion";
import React, { useContext, useEffect, useRef, useState } from "react";
import { EdgePathContext } from "../contexts/edge_path_context";
import {
  CounterAdvanceEvent,
  EvaluationEvent,
  EvaluationEventSource,
  EvaluationListener,
  NodeEvaluateEvent,
} from "../evaluation_listeners";
import { ConnectionToString } from "../pos_flow";
import { ProgramCounter } from "../program_counter";
import { mapIterable } from "../util";

function ProgramCounterComponent({ pc }: { pc: ProgramCounter }) {
  const divRef = useRef<HTMLDivElement>(null);
  const { edgePathHandlers } = useContext(EdgePathContext);

  const edge = pc.currentEdge;

  useEffect(() => {
    if (!divRef.current) return;

    const edgeStr = ConnectionToString(edge);

    function callback(edgePath: string) {
      if (!divRef.current) return;
      divRef.current.style.offsetPath = `path('${edgePath}')`;
    }

    edgePathHandlers.subscribe(edgeStr, callback);
    callback(edgePathHandlers.getLastData(edgeStr));

    return () => {
      edgePathHandlers.unsub(edgeStr, callback);
    };
  }, [edge, edgePathHandlers]);

  return (
    <motion.div
      ref={divRef}
      style={{
        scale: 1,
        position: "absolute",
        ...(pc.currentLocation.nodeId === pc.currentEdge.source.nodeId && {
          offsetDistance: "0%",
        }),
      }}
      initial={{
        scale: 0,
        rotate: -360,
      }}
      exit={{
        scale: 0,
        rotate: 360,
      }}
      className="pc-box"
      animate={{
        scale: 1,
        rotate: 0,
        ...(pc.currentLocation.nodeId === pc.currentEdge.dest.nodeId && {
          offsetDistance: ["0%", "100%"],
        }),
      }}
      // angle={0}
      transition={{
        duration: 0.6,
      }}
    >
      {JSON.stringify(pc.contents)}
    </motion.div>
  );
}

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
        if (e === EvaluationEvent.Start) {
          setProgramCounters(new Map<string, ProgramCounter>());
        }
        if (e === EvaluationEvent.End) {
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
    <AnimatePresence>
      {mapIterable(programCounters.values(), (pc: ProgramCounter) => (
        <ProgramCounterComponent key={pc.id} pc={pc} />
      ))}
    </AnimatePresence>
  );
}
