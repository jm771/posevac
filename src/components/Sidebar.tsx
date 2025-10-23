import cytoscape, { NodeSingular } from "cytoscape";
import { getCytoscapeStyles } from "../styles";
import {
  COMPONENT_REGISTRY,
  ComponentType,
  createNodeFromName,
} from "../nodes";
import { LevelContext, NodeBuildContext } from "../editor_context";
import React, { useEffect, useRef } from "react";
import { Assert } from "../util";

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

export function EditorSidebar({
  levelContext,
}: {
  levelContext: LevelContext;
}) {
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

// Setup node dragging to delete
export function setupNodeDeletion(levelContext: LevelContext): void {
  const context = levelContext.editorContext;
  const sidebar = document.getElementById("sidebar");
  const deleteZone = document.getElementById("deleteZone");
  const cyContainer = document.getElementById("cy");
  if (!sidebar || !deleteZone || !cyContainer) return;

  context.cy.on("drag", "node", function (evt) {
    const node = evt.target;
    const renderedPos = node.renderedPosition();
    const sidebarBounds = sidebar.getBoundingClientRect();
    const cyBounds = cyContainer.getBoundingClientRect();

    // Convert node position to viewport coordinates
    const nodeScreenX = cyBounds.left + renderedPos.x;

    // Check if node is over sidebar (sidebar is on the left)
    if (nodeScreenX < sidebarBounds.right) {
      deleteZone.classList.add("active");
    } else {
      deleteZone.classList.remove("active");
    }
  });

  context.cy.on("free", "node", function (evt) {
    const node: NodeSingular = evt.target;
    const renderedPos = node.renderedPosition();
    const sidebarBounds = sidebar.getBoundingClientRect();
    const cyBounds = cyContainer.getBoundingClientRect();
    const nodeScreenX = cyBounds.left + renderedPos.x;

    // Delete node if dropped in sidebar
    if (nodeScreenX < sidebarBounds.right) {
      // Cy will potentially? trigger for the terminals too
      // we'll just ignore the event if the node isn't in our
      // compNodes list
      const nodeIndex = context.allNodes.findIndex(
        (n) => n.getNodeId() === node.id()
      );

      if (nodeIndex !== -1) {
        const compNode = context.allNodes[nodeIndex];
        if (compNode.deletable) {
          compNode.destroy();
          context.allNodes.splice(nodeIndex, 1);
        }
      }
    }

    deleteZone.classList.remove("active");
  });
}
