import {
  BaseEdge,
  getBezierPath,
  useReactFlow,
  type Edge,
  type EdgeProps,
} from "@xyflow/react";
import React, { useEffect } from "react";

export type AnimatedNodeEdge = Edge<{ node: string }, "animatedNode">;

export function AnimatedNodeEdge({
  id,
  data = { node: "" },
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
}: EdgeProps<AnimatedNodeEdge>) {
  //   const { getNode, updateNode } = useReactFlow();
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });
  console.log("yaaaay");

  //   const selector = useMemo(
  //     () => `.react-flow__node[data-id="${data.node}"]`,
  //     [data.node]
  //   );

  useEffect(() => {
    const node = document.getElementById(`pc-${id}`) as HTMLElement;
    console.log(node);

    if (!node) return;

    node.style.offsetPath = `path('${edgePath}')`;
    node.style.offsetRotate = "0deg";
    // This property is fairly new and not all versions of TypeScript have it
    // in the lib.dom.d.ts file. If you get an error here, you can either
    // ignore it or add the property to the CSSStyleDeclaration interface
    // yourself.
    //
    // @ts-expect-error
    node.style.offsetAnchor = "center";

    // const wasDraggable = getNode(data.node).draggable;

    // updateNode(data.node, { draggable: false });

    return () => {
      //   node.style.offsetPath = "none";
      //   updateNode(data.node, { draggable: wasDraggable });
    };
  }, [edgePath]);

  useEffect(() => {
    const node = document.getElementById(`pc-${id}`) as HTMLElement;

    if (!node) return;

    const keyframes = [{ offsetDistance: "0%" }, { offsetDistance: "100%" }];
    const animation = node.animate(keyframes, {
      duration: 2000,
      direction: "alternate",
      iterations: Infinity,
    });

    return () => {
      animation.cancel();
    };
  }, []);

  return <BaseEdge id={id} path={edgePath} />;
  // <>
  //   {/* <motion.div
  //     className="pc-box"
  //     // animate={{ offsetDistance: ["0%", "100%"] }}
  //     // transition={{
  //     //   repeat: Infinity,
  //     //   duration: 3,
  //     // }}
  //     // style={{ offsetPath: `path('${edgePath}')` }}
  //   >
  //     Hi There!
  //   </motion.div> */}
  //   {/* <div className="pc-box">Hi there!!!</div>
  //   <BaseEdge id={id} path={edgePath} /> */}
  // </>
  //   );
}
