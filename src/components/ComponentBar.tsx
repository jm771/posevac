import cytoscape from "cytoscape";
import React, { useEffect, useRef } from "react";
import { Level } from "../levels";
import { RegularComponentType } from "../node_definitions";
import { getCytoscapeStyles } from "../styles";
import { Assert } from "../util";

export function ComponentBar({ level }: { level: Level }) {
  return (
    <div className="components-list">
      {level.allowedNodes.map((type) => (
        <SidebarElement key={type} type={type} />
      ))}
    </div>
  );
}
export function SidebarElement({ type }: { type: RegularComponentType }) {
  const divRef = useRef<HTMLDivElement>(null);

  // TODO - should remove this cytoscape too
  useEffect(() => {
    Assert(divRef.current !== null);
    const previewCy = cytoscape({
      container: divRef.current,
      style: getCytoscapeStyles(),
      userPanningEnabled: false,
      userZoomingEnabled: false,
      boxSelectionEnabled: false,
      autoungrabify: true,
    });

    previewCy.fit(undefined, 10);
  }, [divRef, type]);

  return (
    <div
      ref={divRef}
      className="component-template"
      id={`preview-${type}`}
      draggable="true"
      onDragStart={(e: React.DragEvent<HTMLDivElement>) => {
        e.dataTransfer.setData("component-type", type);
        e.dataTransfer.effectAllowed = "copy";
      }}
    />
  );
}
