import { Core, NodeSingular } from "cytoscape";
import { GraphEditorContext } from "./editor_context";

// let currentConstantInput: HTMLInputElement | null = null;
// let currentEditingNode: NodeSingular | null = null;

export function initializeConstantControls(
  editorContext: GraphEditorContext
): void {
  const cy = editorContext.cy;

  // Set up HTML labels for constant nodes using cytoscape-node-html-label
  // @ts-ignore - nodeHtmlLabel is added by extension
  cy.nodeHtmlLabel([
    {
      query: 'node[type="constant"]',
      halign: "center",
      valign: "center",
      halignBox: "center",
      valignBox: "center",
      cssClass: "constant-node-display",
      tpl: function (data: any) {
        const value = data.constantValue !== undefined ? data.constantValue : 0;
        const repeat =
          data.constantRepeat !== undefined ? data.constantRepeat : true;
        const modeIcon = repeat ? "∞" : "1×";

        return `
                <div class="constant-display" style="
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 2px;
                    pointer-events: none;
                    user-select: none;
                ">
                    <div style="
                        font-size: 16px;
                        font-weight: bold;
                        color: #fff;
                        text-shadow: 0 1px 2px rgba(0,0,0,0.3);
                    ">${value}</div>
                    <div style="
                        font-size: 10px;
                        font-weight: bold;
                        color: ${repeat ? "#64b5f6" : "#ffb74d"};
                        background: rgba(0,0,0,0.3);
                        padding: 1px 4px;
                        border-radius: 2px;
                    ">${modeIcon}</div>
                </div>
            `;
      },
    },
  ]);

  // Click on constant node to edit
  cy.on("tap", 'node[type="constant"]', (evt) => {
    const node = evt.target as NodeSingular;
    showConstantEditor(editorContext, node);
  });

  // Refresh HTML labels when data changes
  cy.on("data", 'node[type="constant"]', () => {
    // @ts-ignore
    cy.nodeHtmlLabel("refresh");
  });
}

function showConstantEditor(
  editorContext: GraphEditorContext,
  node: NodeSingular
): void {
  // Get current values
  const currentValue =
    node.data("constantValue") !== undefined ? node.data("constantValue") : 0;
  const currentRepeat =
    node.data("constantRepeat") !== undefined
      ? node.data("constantRepeat")
      : true;

  // Create container div
  const container = document.createElement("div");
  container.className = "constant-editor-container";
  container.style.position = "absolute";
  container.style.display = "flex";
  container.style.flexDirection = "column";
  container.style.gap = "4px";
  container.style.alignItems = "center";
  container.style.zIndex = "1000";

  // Dude really? Need to css this thing
  // Create input element for value
  const input = document.createElement("input");
  input.type = "text";
  input.value = String(currentValue);
  input.className = "constant-value-input";
  input.style.padding = "4px 8px";
  input.style.fontSize = "14px";
  input.style.fontWeight = "bold";
  input.style.textAlign = "center";
  input.style.border = "2px solid #64b5f6";
  input.style.borderRadius = "4px";
  input.style.background = "#fff";
  input.style.boxShadow = "0 2px 4px rgba(0,0,0,0.3)";
  input.style.width = "80px";

  // Create toggle button for repeat/once mode
  const toggle = document.createElement("button");
  toggle.className = "constant-toggle-button";
  toggle.textContent = currentRepeat ? "REPEAT" : "ONCE";
  toggle.style.padding = "3px 8px";
  toggle.style.fontSize = "10px";
  toggle.style.fontWeight = "bold";
  toggle.style.border = "1px solid #64b5f6";
  toggle.style.borderRadius = "3px";
  toggle.style.cursor = "pointer";
  toggle.style.background = currentRepeat ? "#64b5f6" : "#ffb74d";
  toggle.style.color = "#fff";
  toggle.style.boxShadow = "0 1px 2px rgba(0,0,0,0.2)";

  container.appendChild(input);
  container.appendChild(toggle);

  // Position the editor over the node
  updateEditorPosition(editorContext.cy, container, node);

  // Add to DOM
  const cyContainer = document.getElementById("cy");
  if (cyContainer) {
    cyContainer.appendChild(container);
    // currentConstantInput = input;
    input.focus();
    input.select();
  }

  // Handle input changes
  input.addEventListener("input", () => {
    let parsedValue: any = input.value;
    const numValue = Number(input.value);
    if (!isNaN(numValue) && input.value.trim() !== "") {
      parsedValue = numValue;
    }
    node.data("constantValue", parsedValue);
  });

  // Handle toggle button click
  toggle.addEventListener("click", (e) => {
    e.stopPropagation();
    const newRepeat = !node.data("constantRepeat");
    node.data("constantRepeat", newRepeat);
    toggle.textContent = newRepeat ? "REPEAT" : "ONCE";
    toggle.style.background = newRepeat ? "#64b5f6" : "#ffb74d";
  });

  // Handle blur - close the editor
  input.addEventListener("blur", () => {
    setTimeout(() => {
      // Only close if we're not clicking the toggle button
      if (document.activeElement !== toggle) {
        closeConstantEditor(editorContext.cy, input);
      }
    }, 100);
  });

  // Handle Enter key - close the editor
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      closeConstantEditor(editorContext.cy, input);
    } else if (e.key === "Escape") {
      // Restore original values on Escape
      node.data("constantValue", currentValue);
      node.data("constantRepeat", currentRepeat);
      closeConstantEditor(editorContext.cy, input);
    }
  });

  // Prevent clicks on editor from propagating
  container.addEventListener("mousedown", (e) => e.stopPropagation());
  container.addEventListener("click", (e) => e.stopPropagation());

  // Update position on zoom/pan/drag
  const updateHandler = () =>
    updateEditorPosition(editorContext.cy, container, node);
  editorContext.cy.on("zoom pan viewport drag", updateHandler);

  // Store handler for cleanup
  (container as any)._updateHandler = updateHandler;
}

/**
 * Update editor position to match node position
 */
function updateEditorPosition(
  cy: Core,
  container: HTMLElement,
  node: NodeSingular
): void {
  // Get node position in model coordinates
  const nodePos = node.position();

  // Convert to rendered coordinates
  const zoom = cy.zoom();
  const pan = cy.pan();
  const renderedX = nodePos.x * zoom + pan.x;
  const renderedY = nodePos.y * zoom + pan.y;

  // Position editor
  container.style.left = `${renderedX}px`;
  container.style.top = `${renderedY}px`;
  container.style.transform = "translate(-50%, -50%)";
}

function closeConstantEditor(cy: Core, constantInput: HTMLInputElement): void {
  if (constantInput.parentElement) {
    const container = constantInput.parentElement;

    // Remove zoom/pan listener
    if ((container as any)._updateHandler) {
      cy.off("zoom pan viewport drag", (container as any)._updateHandler);
    }

    // Remove from DOM
    if (container.parentElement) {
      container.parentElement.removeChild(container);
    }
  }
}

export function createConstantControls(_node: NodeSingular, cy: Core): void {
  // Refresh HTML labels to show the new node
  // @ts-ignore
  cy.nodeHtmlLabel("refresh");
}

/**
 * Remove controls for a specific node
 */
// export function removeConstantControls(_nodeId: string): void {
//     // Close editor if this node is being edited
//     if (currentEditingNode && currentEditingNode.id() === _nodeId) {
//         closeConstantEditor();
//     }
// }
