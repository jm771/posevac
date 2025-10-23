import { EdgeSingular, NodeSingular, Position } from "cytoscape";
import { LevelContext } from "./editor_context";


let tempEdge: EdgeSingular | null = null;

// Setup right-click edge creation/deletion
export function setupEdgeCreation(levelContext: LevelContext): void {


  // Prevent context menu on cytoscape canvas
  const cyContainer = document.getElementById("cy");
  if (!cyContainer) return;

  cyContainer.addEventListener("contextmenu", 

  // Track right mouse button down on node using DOM event
  cyContainer.addEventListener("mousedown", function 
  });

  // Track mouse movement with DOM event
  cyContainer.addEventListener("mousemove", 

  // Handle mouse up with DOM event
  cyContainer.addEventListener("mouseup", function (e: MouseEvent) {
    const cy = levelContext.editorContext.cy;
    if (e.button === 2 && isRightDragging) {
      // Right button
      // Clean up temp edge
      if (tempEdge) {
        cy.remove(tempEdge);
        tempEdge = null;
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
      if (sourceNode && targetNode && sourceNode.id() !== targetNode.id()) {
        // Validate edge rules:
        // 1. Source must be an output terminal
        // 2. Target must be an input terminal
        // 3. Can't connect to compound parent (start/stop)

        const sourceType = sourceNode.data("terminalType");
        const targetType = targetNode.data("terminalType");

        // Check if source is output and target is input
        if (sourceType === "output" && targetType === "input") {
          // Check if edge already exists
          const existingEdge = cy.edges(
            `[source="${sourceNode.id()}"][target="${targetNode.id()}"]`
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
                source: sourceNode.id(),
                target: targetNode.id(),
                condition: "",
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


    }
  });
}
