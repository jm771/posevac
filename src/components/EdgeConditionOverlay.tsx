import { Edge, useEdges, XYPosition } from "@xyflow/react";
import React, { useContext, useEffect, useRef } from "react";
import { EdgePathContext } from "../contexts/edge_path_context";
import { Connection, ConnectionToString } from "../pos_flow";
import { NotNull } from "../util";

export function EdgeConditon({ edge }: { edge: Edge<Connection> }) {
  const divRef = useRef<HTMLDivElement>(null);
  const { edgeCenterHandlers } = useContext(EdgePathContext);

  useEffect(() => {
    if (!divRef.current) return;
    console.log("a");

    const edgeStr = ConnectionToString(NotNull(edge.data));

    function callback(center: XYPosition) {
      if (!divRef.current) return;
      // if (!center) return;
      console.log("b");
      divRef.current.style.transform = `translate(-50%, -50%) translate(${center.x}px, ${center.y}px)`;
    }

    edgeCenterHandlers.subscribe(edgeStr, callback);
    callback(edgeCenterHandlers.getLastData(edgeStr));

    return () => {
      edgeCenterHandlers.unsub(edgeStr, callback);
    };
  }, [edge, edgeCenterHandlers]);

  return (
    <div ref={divRef} style={{ position: "absolute" }}>
      Hi there
    </div>
  );
}

export function EdgeConditionOverlay() {
  const edges: Edge<Connection>[] = useEdges();

  return (
    <>
      {edges.map((edge: Edge<Connection>) => (
        <EdgeConditon key={`${edge.id}-overlay`} edge={edge} />
      ))}
    </>
  );
}

// export function EdgeConditionOverlay({ cy }: { cy: Core }) {
//   const [selectedEdge, setSelectedEdge] = useState<EdgeSingular | null>(null);
//   const [, setConditionVersion] = useState<number>(0);
//   const incConditionVersion = () => setConditionVersion((x) => x + 1);
//   const panZoom = useContext(PanZoomContext);

//   function nodeTapHandler() {
//     setSelectedEdge(null);
//   }

//   function edgeTapHandler(evt: EventObject) {
//     setSelectedEdge(evt.target as EdgeSingular);
//   }

//   useEffect(() => {
//     function tapHandler(evt: EventObject) {
//       if (evt.target === cy) {
//         setSelectedEdge(null);
//       }
//     }

//     cy.on("tap", "edge", edgeTapHandler);
//     cy.on("tap", tapHandler);
//     cy.on("tap", "node", nodeTapHandler);
//     return () => {
//       cy.off("tap", "edge", edgeTapHandler);
//       cy.off("tap", tapHandler);
//       cy.off("tap", "node", nodeTapHandler);
//     };
//   }, [cy]);

//   // Disable panning when overlay is open
//   useEffect(() => {
//     if (selectedEdge) {
//       cy.userPanningEnabled(false);
//     } else {
//       cy.userPanningEnabled(true);
//     }

//     return () => {
//       cy.userPanningEnabled(true);
//     };
//   }, [selectedEdge, cy]);

//   function handleAddMatcher() {
//     if (!selectedEdge) return;
//     const condition = selectedEdge.data("condition") as Condition;
//     const newMatchers = [...condition.matchers, Matcher.Wild];
//     selectedEdge.data("condition", new Condition(newMatchers));
//     incConditionVersion();
//   }

//   function handleCycleMatcher(index: number, e: React.MouseEvent) {
//     e.stopPropagation();
//     e.preventDefault();
//     e.nativeEvent.stopImmediatePropagation();
//     if (!selectedEdge) return;
//     const condition = selectedEdge.data("condition") as Condition;
//     const newMatchers = [...condition.matchers];
//     // Cycle: Wild -> Zero -> One -> Wild
//     newMatchers[index] = (newMatchers[index] + 1) % 5;
//     selectedEdge.data("condition", new Condition(newMatchers));
//     incConditionVersion();
//   }

//   function handleRemoveLastMatcher(e: React.MouseEvent) {
//     e.stopPropagation();
//     e.preventDefault();
//     e.nativeEvent.stopImmediatePropagation();
//     if (!selectedEdge) return;
//     const condition = selectedEdge.data("condition") as Condition;
//     if (condition.matchers.length === 0) return;
//     const newMatchers = condition.matchers.slice(0, -1);
//     selectedEdge.data("condition", new Condition(newMatchers));
//     incConditionVersion();
//   }

//   function handleAddMatcherClick(e: React.MouseEvent) {
//     e.stopPropagation();
//     e.preventDefault();
//     e.nativeEvent.stopImmediatePropagation();
//     handleAddMatcher();
//   }

//   function stopEvent(e: React.MouseEvent) {
//     e.stopPropagation();
//     e.preventDefault();
//     e.nativeEvent.stopImmediatePropagation();
//   }

//   const pos = selectedEdge && getEdgeCenter(selectedEdge);
//   const condition = selectedEdge?.data("condition") as Condition;
//   return (
//     selectedEdge && (
//       <div
//         className="edge-condition-input"
//         style={styleForPosition(pos!, panZoom)}
//         onMouseDown={stopEvent}
//         onMouseUp={stopEvent}
//         onClick={stopEvent}
//       >
//         <div className="matcher-list">
//           <span>(</span>
//           {condition.matchers.map((matcher, index) => (
//             <React.Fragment key={index}>
//               {index != 0 && <span>,</span>}
//               <button
//                 className="matcher-button"
//                 onMouseDown={(e) => handleCycleMatcher(index, e)}
//                 onClick={stopEvent}
//               >
//                 {MATCHER_LABELS[matcher]}
//               </button>
//             </React.Fragment>
//           ))}
//           <span>)</span>
//           <button
//             className="matcher-add-button"
//             onMouseDown={handleAddMatcherClick}
//             onClick={stopEvent}
//           >
//             +
//           </button>
//           {condition.matchers.length > 0 && (
//             <button
//               className="matcher-remove-button"
//               onMouseDown={handleRemoveLastMatcher}
//               onClick={stopEvent}
//             >
//               −
//             </button>
//           )}
//         </div>
//       </div>
//     )
//   );
// }
