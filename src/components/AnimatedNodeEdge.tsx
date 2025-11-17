import {
  BaseEdge,
  getBezierPath,
  type Edge,
  type EdgeProps,
} from "@xyflow/react";
import React, { useContext, useEffect } from "react";
import { EdgePathContext } from "../contexts/edge_path_context";
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
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX: sourceX - 6,
    sourceY,
    sourcePosition,
    targetX: targetX + 6,
    targetY,
    targetPosition,
  });

  const { edgePathHandlers } = useContext(EdgePathContext);

  useEffect(() => {
    edgePathHandlers.updateVal(ConnectionToString(NotNull(data)), edgePath);
  }, [data, edgePath, edgePathHandlers]);

  return <BaseEdge id={id} path={edgePath} />;
}
