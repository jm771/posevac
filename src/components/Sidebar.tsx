import cytoscape from "cytoscape";
import { getCytoscapeStyles } from "../styles";
import {
  COMPONENT_REGISTRY,
  ComponentType,
  createNodeFromName,
} from "../nodes";
import { LevelContext, NodeBuildContext } from "../editor_context";
import React, { useEffect, useRef } from "react";

export function SidebarElement({ type }: { type: ComponentType }) {
  const divRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previewCy = cytoscape({
      container: divRef.current,
      style: getCytoscapeStyles(),
      userPanningEnabled: false,
      userZoomingEnabled: false,
      boxSelectionEnabled: false,
      autoungrabify: true,
    });

    let context: NodeBuildContext = { cy: previewCy, nodeIdCounter: 0 };

    createNodeFromName(context, type, 0, 0);

    previewCy.fit(undefined, 10);
  }, [divRef]);

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
    const node = evt.target;
    const renderedPos = node.renderedPosition();
    const sidebarBounds = sidebar.getBoundingClientRect();
    const cyBounds = cyContainer.getBoundingClientRect();

    // Convert node position to viewport coordinates
    const nodeScreenX = cyBounds.left + renderedPos.x;

    // Delete node if dropped in sidebar
    if (nodeScreenX < sidebarBounds.right) {
      const nodeType = node.data("type");
      // Check if node is deletable (input/output nodes are not deletable)
      const isDeletable = node.data("deletable") !== false;

      if (!isDeletable) {
        console.log("This node cannot be deleted");
        deleteZone.classList.remove("active");
        return;
      }

      const nodeId = node.id();

      // Hopefully not needed with proper usage patterns - constant controls should all be children of the node
      // Remove constant controls if it's a constant node
      // if (nodeType === 'constant') {
      //     removeConstantControls(nodeId);
      // }

      // Remove from userNodes array
      const nodeIndex = context.allNodes.findIndex(
        (n) => n.getNodeId() === nodeId
      );
      if (nodeIndex !== -1) {
        context.allNodes.splice(nodeIndex, 1);
        console.log(
          `Removed node from context. Total user nodes: ${context.allNodes.length}`
        );
      }

      // If it's a compound node or input/output node or constant node, remove all children first
      if (
        nodeType === "compound" ||
        nodeType === "input" ||
        nodeType === "output" ||
        nodeType === "constant"
      ) {
        node.children().remove();
        node.remove();
      }
      // If it's a child node (terminal), remove parent too
      else if (node.parent().length > 0) {
        const parent = node.parent();
        const parentId = parent.id();

        // Remove parent from userNodes array
        const parentIndex = context.allNodes.findIndex(
          (n) => n.getNodeId() === parentId
        );
        if (parentIndex !== -1) {
          context.allNodes.splice(parentIndex, 1);
          console.log(
            `Removed parent node from context. Total user nodes: ${context.allNodes.length}`
          );
        }

        parent.children().remove();
        parent.remove();
      } else {
        node.remove();
      }
    }

    deleteZone.classList.remove("active");
  });
}
