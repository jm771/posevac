import React, { useEffect, useRef } from "react";
import { LevelContext, NodeBuildContext } from "../editor_context";
import {
  COMPONENT_REGISTRY,
  ComponentType,
  createNodeFromName,
} from "../nodes";
import cytoscape from "cytoscape";
import { getCytoscapeStyles } from "../styles";
import { Assert } from "../util";

export function ComponentBar({ levelContext }: { levelContext: LevelContext }) {
  return (
    <div className="components-list">
      {Array.from(COMPONENT_REGISTRY.keys())
        .filter((type) =>
          levelContext.editorContext.level.allowedNodes.includes(type)
        )
        .map((type) => (
          <SidebarElement key={type} type={type} />
        ))}
    </div>
  );
}
export function SidebarElement({ type }: { type: ComponentType }) {
  const divRef = useRef<HTMLDivElement>(null);

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

    const context: NodeBuildContext = { cy: previewCy, nodeIdCounter: 0 };

    createNodeFromName(context, type, 0, 0);

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
