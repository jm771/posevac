import {
  BaseEdge,
  getBezierPath,
  type Edge,
  type EdgeProps,
} from "@xyflow/react";
import React, { useEffect } from "react";
import { Connection, ConnectionToString } from "../pos_flow";
import { NotNull } from "../util";

export type AnimatedNodeEdge = Edge<Connection, "animatedNode">;

export function AnimatedNodeEdge({
  id,
  data,
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
  useEffect(() => {
    const node = document.getElementById(
      `pc-${ConnectionToString(NotNull(data))}`
    ) as HTMLElement;

    if (!node) return;

    node.style.offsetPath = `path('${edgePath}')`;

    const keyframes = [{ offsetDistance: "0%" }, { offsetDistance: "100%" }];
    const animation = node.animate(keyframes, {
      duration: 2000,
      direction: "alternate",
      iterations: Infinity,
    });

    return () => {
      animation.cancel();
    };
  }, [data, edgePath]);

  return <BaseEdge id={id} path={edgePath} />;
}
