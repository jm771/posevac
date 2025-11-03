import { EdgeSingular, NodeSingular, Position } from "cytoscape";
import React, { useRef, useState } from "react";
import { Condition } from "../condition";
import { LevelContext } from "../editor_context";

// TODO Should move into state??
let edgeIdCounter = 0;

export function CyContainer({
  levelContext,
  children,
}: {
  levelContext: LevelContext | null;
  children: React.JSX.Element;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  // const [isRightDragging, setIsRightDragging] = useState<boolean>(false);
  const isRightDraggingRef = useRef<boolean>(false);
  const sourceNodeRef = useRef<NodeSingular | null>(null);
  const [mousePos, setMousePos] = useState<Position>({ x: 0, y: 0 });
  const tempEdgeRef = useRef<EdgeSingular | null>(null);
  // const [tempEdge, setTempEdge] = useState<EdgeSingular | null>(null);

  function handleStartMakeEdge(e: React.MouseEvent<HTMLElement>) {
    if (levelContext === null || containerRef.current == null) return;
    const cy = levelContext.editorContext.cy;
    const cyContainer = containerRef.current;
    const cyBounds = cyContainer.getBoundingClientRect();
    const renderedX = e.clientX - cyBounds.left;
    const renderedY = e.clientY - cyBounds.top;

    const pan = cy.pan();
    const zoom = cy.zoom();
    const modelX = (renderedX - pan.x) / zoom;
    const modelY = (renderedY - pan.y) / zoom;

    const elements = cy.elements().filter(function (ele) {
      if (ele.isNode()) {
        const bb = ele.boundingBox();
        return (
          modelX >= bb.x1 &&
          modelX <= bb.x2 &&
          modelY >= bb.y1 &&
          modelY <= bb.y2
        );
      }
      return false;
    });

    if (elements.length > 0) {
      // Sort by size and pick smallest
      const sorted = elements.sort(function (a, b) {
        const aBox = a.boundingBox();
        const bBox = b.boundingBox();
        const aArea = (aBox.x2 - aBox.x1) * (aBox.y2 - aBox.y1);
        const bArea = (bBox.x2 - bBox.x1) * (bBox.y2 - bBox.y1);
        return aArea - bArea;
      });
      const node = sorted[0] as NodeSingular;

      // Only allow connections to start from output terminals
      if (node.data("terminalType") === "output") {
        e.preventDefault();
        e.stopPropagation();

        isRightDraggingRef.current = true;
        sourceNodeRef.current = node;
        setMousePos({ x: modelX, y: modelY });

        // Disable normal node dragging during right-click drag
        cy.autoungrabify(true);
      }
    }
  }

  function mouseMoveHandler(e: React.MouseEvent<HTMLElement>) {
    if (levelContext === null || containerRef.current == null) return;
    const cy = levelContext.editorContext.cy;
    const cyContainer = containerRef.current;
    if (isRightDraggingRef.current && sourceNodeRef.current) {
      // Convert screen position to model position
      const cyBounds = cyContainer.getBoundingClientRect();
      const renderedX = e.clientX - cyBounds.left;
      const renderedY = e.clientY - cyBounds.top;

      const pan = cy.pan();
      const zoom = cy.zoom();
      const modelX = (renderedX - pan.x) / zoom;
      const modelY = (renderedY - pan.y) / zoom;

      // Store mouse position
      setMousePos({ x: modelX, y: modelY });

      // Remove previous temp edge
      if (tempEdgeRef.current) {
        cy.remove(tempEdgeRef.current);
      }

      const tempTargetId = "temp-target";

      // Remove old temp target if exists
      cy.$(`#${tempTargetId}`).remove();

      // Create invisible temp target node at cursor position
      cy.add({
        group: "nodes",
        data: { id: tempTargetId },
        position: mousePos,
      });

      tempEdgeRef.current = cy.add({
        group: "edges",
        data: {
          id: "temp-edge",
          source: sourceNodeRef.current.id(),
          target: tempTargetId,
          condition: new Condition([]),
        },
        classes: "temp",
      }) as EdgeSingular;
    }
  }

  // function mouseUpHandler(e: React.MouseEvent<HTMLElement>) {
  function handleEndMakeEdge() {
    if (levelContext === null || containerRef.current == null) return;
    const cy = levelContext.editorContext.cy;
    // const cyContainer = containerRef.current;
    // Right button
    // Clean up temp edge
    if (tempEdgeRef.current) {
      cy.remove(tempEdgeRef.current);
      tempEdgeRef.current = null;
    }
    cy.$("#temp-target").remove();

    // Find what node is at the current mouse position
    const elements = cy.elements().filter(function (ele) {
      if (ele.isNode()) {
        const bb = ele.boundingBox();
        return (
          mousePos.x >= bb.x1 &&
          mousePos.x <= bb.x2 &&
          mousePos.y >= bb.y1 &&
          mousePos.y <= bb.y2
        );
      }
      return false;
    });

    // Get the top-most node (smallest one, likely a terminal or regular node)
    let targetNode: NodeSingular | null = null;
    if (elements.length > 0) {
      // Sort by size (area) and pick the smallest
      const sorted = elements.sort(function (a, b) {
        const aBox = a.boundingBox();
        const bBox = b.boundingBox();
        const aArea = (aBox.x2 - aBox.x1) * (aBox.y2 - aBox.y1);
        const bArea = (bBox.x2 - bBox.x1) * (bBox.y2 - bBox.y1);
        return aArea - bArea;
      });
      targetNode = sorted[0] as NodeSingular;
    }

    // Create or delete edge if we have a valid target
    if (
      sourceNodeRef.current &&
      targetNode &&
      sourceNodeRef.current.id() !== targetNode.id()
    ) {
      // Validate edge rules:
      // 1. Source must be an output terminal
      // 2. Target must be an input terminal
      // 3. Can't connect to compound parent (start/stop)

      const sourceType = sourceNodeRef.current.data("terminalType");
      const targetType = targetNode.data("terminalType");

      // Check if source is output and target is input
      if (sourceType === "output" && targetType === "input") {
        // Check if edge already exists
        const existingEdge = cy.edges(
          `[source="${sourceNodeRef.current.id()}"][target="${targetNode.id()}"]`
        );

        if (existingEdge.length > 0) {
          // Delete existing edge
          existingEdge.remove();
        } else {
          // Create new edge
          cy.add({
            group: "edges",
            data: {
              id: `edge-${edgeIdCounter++}`,
              source: sourceNodeRef.current.id(),
              target: targetNode.id(),
              condition: new Condition([]),
            },
          });
        }
      } else {
        // Invalid connection direction
        console.log(
          "Edges can only go from output terminals to input terminals"
        );
      }
    }
    // Reset state
    sourceNodeRef.current = null;
    isRightDraggingRef.current = false;
    cy.autoungrabify(false);
  }

  function mouseDownHander(e: React.MouseEvent<HTMLElement>) {
    if (e.button === 0) {
      if (isRightDraggingRef.current == true) {
        handleEndMakeEdge();
      } else {
        handleStartMakeEdge(e);
      }
    }
  }

  return (
    <main
      ref={containerRef}
      className="canvas-container"
      onMouseDown={mouseDownHander}
      onMouseMove={mouseMoveHandler}
      onContextMenu={(e) => e.preventDefault()}
    >
      {children}
    </main>
  );
}
