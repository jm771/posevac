import { Edge } from "@xyflow/react";
import { motion } from "framer-motion";
import React, { useContext } from "react";
import { EdgesContext } from "../contexts/edges_context";
import { EvaluationEventSource } from "../evaluation_listeners";
import { Connection } from "../pos_flow";

function ProgramCounterComponent({ edge }: { edge: Edge<Connection> }) {
  // const rf = useReactFlow();
  // rf.get
  // const { getNode } = useReactFlow();

  // const source = NotNull(getNode(edge.source));
  // const target = NotNull(getNode(edge.target));
  // // if (!source || !target) return null;

  // const sourceHandle = source.position;
  // const targetHandle = target.position;

  // const [edgePath] = getBezierPath({
  //   sourceX: sourceHandle.x, //+ source.width! / 2,
  //   sourceY: sourceHandle.y, //+ source.height! / 2,
  //   targetX: targetHandle.x, //+ target.width! / 2,
  //   targetY: targetHandle.y, //+ target.height! / 2,
  //   // sourcePosition: 'right',
  //   // targetPosition: 'left',
  // });

  //   return { path, labelX, labelY };
  // }

  //   const [edgePath] = getBezierPath(edge);
  // console.log(edgePath);

  return (
    <motion.div
      id={`pc-${edge.id}`}
      style={{
        position: "absolute",
        // offsetPath: `path('${edgePath}')`,
        // transform: `translate(${sourceHandle.x}px, ${sourceHandle.y}px)`,
      }}
      className="pc-box"
      // animate={{ offsetDistance: ["0%", "100%"] }}
      // transition={{
      //   repeat: Infinity,
      //   duration: 3,
      // }}
    >
      Hi There!
    </motion.div>
  );
}

export function ProgramCounterOverlay({
  evaluationEventSource,
}: {
  evaluationEventSource: EvaluationEventSource;
}) {
  // const edges = useContext(EdgesContext);

  const edges = useContext(EdgesContext);

  return (
    <>
      {edges.map((n) => (
        <ProgramCounterComponent key={n.id} edge={n}>
          {/* Hello there!!! */}
        </ProgramCounterComponent>
      ))}
    </>
  );
}
// export function ProgramCounterOverlay({
//   evaluationEventSource,
// }: {
//   evaluationEventSource: EvaluationEventSource;
// }) {
//   const [programCounters, setProgramCounters] = useState<
//     Map<string, ProgramCounter>
//   >(new Map<string, ProgramCounter>());

//   useEffect(() => {
//     const evaluationListenerCallbacks: EvaluationListener = {
//       onCounterAdvance: (e: CounterAdvanceEvent) => {
//         setProgramCounters((pcs) => {
//           const newProgramCounters = new Map(pcs);
//           // this is mutating the original object but it's... ok
//           newProgramCounters.get(e.programCounterId)!.currentLocation =
//             e.endTerminal;

//           return newProgramCounters;
//         });
//       },
//       onNodeEvaluate: (e: NodeEvaluateEvent) => {
//         setProgramCounters((pcs) => {
//           const newProgramCounters: Map<string, ProgramCounter> = new Map(pcs);
//           e.inputCounters.forEach((pc) => newProgramCounters.delete(pc.id));
//           e.outputCounters.forEach((pc) => newProgramCounters.set(pc.id, pc));
//           return newProgramCounters;
//         });
//       },
//       onEvaluationEvent: (e: EvaluationEvent) => {
//         if (e === EvaluationEvent.Start) {
//           setProgramCounters(new Map<string, ProgramCounter>());
//         }
//         if (e === EvaluationEvent.End) {
//           setProgramCounters(new Map<string, ProgramCounter>());
//         }
//       },
//     };

//     const evaluationRegistration = evaluationEventSource.registerListener(
//       evaluationListenerCallbacks
//     );

//     return () => {
//       evaluationEventSource.deregisterListener(evaluationRegistration);
//     };
//   }, [evaluationEventSource]);

//   return (
//     <AnimatePresence>
//       {mapIterable(programCounters.values(), (pc: ProgramCounter) => (
//         <ProgramCounterComponent
//           key={pc.id}
//           // TODO fix
//           position={{ x: 0, y: 0 }}
//           // position={pc.currentLocation.position()}
//           text={JSON.stringify(pc.contents)}
//           angle={0}
//         />
//       ))}
//     </AnimatePresence>
//   );
// }
