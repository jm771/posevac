// import { EdgeSingular, Core, NodeSingular } from "cytoscape";

// // TODO remove this too
// let currentEdgeInput: HTMLInputElement | null = null;

// function showEdgeConditionInput(cy: Core, edge: EdgeSingular): void {
//   // Close any existing input
//   closeEdgeConditionInput(cy);

//   // Update position on zoom/pan
//   const updateHandler = () => updateInputPosition(cy, input, edge);
//   , updateHandler);

//   // Store handler for cleanup
//   (input as any)._updateHandler = updateHandler;
// }

// function updateInputPosition(
//   cy: Core,
//   input: HTMLInputElement,
//   edge: EdgeSingular
// ): void {
//   const pos = midpoint();

//   // Convert to rendered coordinates
// }

// function closeEdgeConditionInput(cy: Core): void {
//   if (currentEdgeInput) {
//     // Remove zoom/pan listener
//     if ((currentEdgeInput as any)._updateHandler) {
//       cy.off("zoom pan viewport", (currentEdgeInput as any)._updateHandler);
//     }

//     // Remove from DOM
//     if (currentEdgeInput.parentElement) {
//       currentEdgeInput.parentElement.removeChild(currentEdgeInput);
//     }
//     currentEdgeInput = null;
//   }
// }
