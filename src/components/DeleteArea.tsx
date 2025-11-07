import React from "react";
import { ComputeNode } from "../nodes";

export function DeleteArea({
  draggedNode,
  nodeIsOverBar,
}: {
  draggedNode: ComputeNode | null;
  nodeIsOverBar: boolean;
}) {
  return (
    <div
      className={`delete-zone ${
        draggedNode?.definition?.deletable && nodeIsOverBar ? "active" : ""
      }`}
      id="deleteZone"
    >
      <span>Drop here to delete</span>
    </div>
  );
}
