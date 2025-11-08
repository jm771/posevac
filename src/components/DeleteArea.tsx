import { Node } from "@xyflow/react";
import React from "react";
import { NodeDefinition } from "../node_definitions";

export function DeleteArea({
  draggedNode,
  nodeIsOverBar,
}: {
  draggedNode: Node<NodeDefinition> | null;
  nodeIsOverBar: boolean;
}) {
  return (
    <div
      className={`delete-zone ${
        draggedNode?.data?.deletable && nodeIsOverBar ? "active" : ""
      }`}
      id="deleteZone"
    >
      <span>Drop here to delete</span>
    </div>
  );
}
