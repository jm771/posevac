import React from "react";
import { CompNode } from "../nodes";

export function DeleteArea({
  draggedNode,
  nodeIsOverBar,
}: {
  draggedNode: CompNode | null;
  nodeIsOverBar: boolean;
}) {
  return (
    <div
      className={`delete-zone ${
        draggedNode?.deletable && nodeIsOverBar ? "active" : ""
      }`}
      id="deleteZone"
    >
      <span>Drop here to delete</span>
    </div>
  );
}
