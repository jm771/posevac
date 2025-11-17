import React from "react";

export function DeleteArea({ deleteActive }: { deleteActive: boolean }) {
  return (
    <div
      className={`delete-zone ${deleteActive ? "active" : ""}`}
      id="deleteZone"
    >
      <span>Drop here to delete</span>
    </div>
  );
}
