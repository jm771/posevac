// Interactive Graph Tool with Cytoscape.js
// Main application logic

// Global state
let cy; // Cytoscape instance
let nodeIdCounter = 0;
let edgeIdCounter = 0;
let draggedElement = null;
let rightClickSource = null;
let tempEdge = null;

// Initialize Cytoscape
function initCytoscape() {
    cy = cytoscape({
        container: document.getElementById('cy'),

        style: [
            // Start node styles
            {
                selector: 'node[type="start"]',
                style: {
                    'background-color': '#81c784',
                    'width': 70,
                    'height': 40,
                    'shape': 'roundrectangle',
                    'label': 'data(label)',
                    'color': 'white',
                    'text-valign': 'center',
                    'text-halign': 'center',
                    'font-size': 12,
                    'font-weight': 'bold',
                    'border-width': 3,
                    'border-color': '#81c784',
                    'box-shadow': '0 0 10px rgba(129, 199, 132, 0.3)'
                }
            },
            // Stop node styles
            {
                selector: 'node[type="stop"]',
                style: {
                    'background-color': '#e57373',
                    'width': 70,
                    'height': 40,
                    'shape': 'roundrectangle',
                    'label': 'data(label)',
                    'color': 'white',
                    'text-valign': 'center',
                    'text-halign': 'center',
                    'font-size': 12,
                    'font-weight': 'bold',
                    'border-width': 3,
                    'border-color': '#e57373',
                    'box-shadow': '0 0 10px rgba(229, 115, 115, 0.3)'
                }
            },
            // Compound parent node styles
            {
                selector: 'node[type="compound"]',
                style: {
                    'background-color': '#2d2d30',
                    'border-width': 2,
                    'border-color': '#ba68c8',
                    'label': 'data(label)',
                    'color': '#d4d4d4',
                    'text-valign': 'center',
                    'text-halign': 'center',
                    'font-size': 11,
                    'padding': 15,
                    'shape': 'roundrectangle',
                    'box-shadow': '0 0 10px rgba(186, 104, 200, 0.3)'
                }
            },
            // Input terminal styles (children of compound)
            {
                selector: 'node[type="input-terminal"]',
                style: {
                    'background-color': '#81c784',
                    'width': 12,
                    'height': 12,
                    'border-width': 2,
                    'border-color': '#81c784',
                    'label': '',
                    'events': 'yes'
                }
            },
            // Output terminal styles (children of compound)
            {
                selector: 'node[type="output-terminal"]',
                style: {
                    'background-color': '#ffb74d',
                    'width': 12,
                    'height': 12,
                    'border-width': 2,
                    'border-color': '#ffb74d',
                    'label': '',
                    'events': 'yes'
                }
            },
            // Edge styles
            {
                selector: 'edge',
                style: {
                    'width': 2,
                    'line-color': '#4fc3f7',
                    'target-arrow-color': '#4fc3f7',
                    'target-arrow-shape': 'triangle',
                    'curve-style': 'bezier',
                    'arrow-scale': 1.5
                }
            },
            // Temporary edge (during right-click drag)
            {
                selector: 'edge.temp',
                style: {
                    'line-color': '#ffb74d',
                    'target-arrow-color': '#ffb74d',
                    'line-style': 'dashed',
                    'opacity': 0.6
                }
            },
            // Selected elements
            {
                selector: ':selected',
                style: {
                    'border-color': '#ffb74d',
                    'border-width': 4
                }
            }
        ],

        layout: {
            name: 'preset'
        },

        // Interaction settings
        minZoom: 0.5,
        maxZoom: 2,
        wheelSensitivity: 0.2,

        // Disable default behaviors we'll implement custom
        autoungrabify: false,
        userPanningEnabled: true,
        userZoomingEnabled: true,
        boxSelectionEnabled: false
    });

}

// Create a start node (has 1 output terminal)
function createStartNode(x, y) {
    const nodeId = `node-${nodeIdCounter++}`;
    const outputId = `${nodeId}-out`;

    // Add start node
    cy.add({
        group: 'nodes',
        data: {
            id: nodeId,
            label: 'start',
            type: 'start'
        },
        position: { x, y }
    });

    // Add output terminal (right edge)
    cy.add({
        group: 'nodes',
        data: {
            id: outputId,
            parent: nodeId,
            type: 'output-terminal',
            terminalType: 'output'
        },
        position: { x: x + 35, y: y }
    });

    cy.$(`#${outputId}`).ungrabify();
}

// Create a stop node (has 1 input terminal)
function createStopNode(x, y) {
    const nodeId = `node-${nodeIdCounter++}`;
    const inputId = `${nodeId}-in`;

    // Add stop node
    cy.add({
        group: 'nodes',
        data: {
            id: nodeId,
            label: 'stop',
            type: 'stop'
        },
        position: { x, y }
    });

    // Add input terminal (left edge)
    cy.add({
        group: 'nodes',
        data: {
            id: inputId,
            parent: nodeId,
            type: 'input-terminal',
            terminalType: 'input'
        },
        position: { x: x - 35, y: y }
    });

    cy.$(`#${inputId}`).ungrabify();
}

// Create a plus node (2 inputs, 1 output)
function createPlusNode(x, y) {
    const nodeId = `node-${nodeIdCounter++}`;
    const input1Id = `${nodeId}-in1`;
    const input2Id = `${nodeId}-in2`;
    const outputId = `${nodeId}-out`;

    cy.add({
        group: 'nodes',
        data: {
            id: nodeId,
            label: '+',
            type: 'compound'
        },
        position: { x, y }
    });

    cy.add({
        group: 'nodes',
        data: {
            id: input1Id,
            parent: nodeId,
            type: 'input-terminal',
            terminalType: 'input'
        },
        position: { x: x - 45, y: y - 20 }
    });

    cy.add({
        group: 'nodes',
        data: {
            id: input2Id,
            parent: nodeId,
            type: 'input-terminal',
            terminalType: 'input'
        },
        position: { x: x - 45, y: y + 20 }
    });

    cy.add({
        group: 'nodes',
        data: {
            id: outputId,
            parent: nodeId,
            type: 'output-terminal',
            terminalType: 'output'
        },
        position: { x: x + 45, y: y }
    });

    cy.$(`#${input1Id}, #${input2Id}, #${outputId}`).ungrabify();
}

// Create a combine node (2 inputs, 1 output)
function createCombineNode(x, y) {
    const nodeId = `node-${nodeIdCounter++}`;
    const input1Id = `${nodeId}-in1`;
    const input2Id = `${nodeId}-in2`;
    const outputId = `${nodeId}-out`;

    cy.add({
        group: 'nodes',
        data: {
            id: nodeId,
            label: 'combine',
            type: 'compound'
        },
        position: { x, y }
    });

    cy.add({
        group: 'nodes',
        data: {
            id: input1Id,
            parent: nodeId,
            type: 'input-terminal',
            terminalType: 'input'
        },
        position: { x: x - 45, y: y - 20 }
    });

    cy.add({
        group: 'nodes',
        data: {
            id: input2Id,
            parent: nodeId,
            type: 'input-terminal',
            terminalType: 'input'
        },
        position: { x: x - 45, y: y + 20 }
    });

    cy.add({
        group: 'nodes',
        data: {
            id: outputId,
            parent: nodeId,
            type: 'output-terminal',
            terminalType: 'output'
        },
        position: { x: x + 45, y: y }
    });

    cy.$(`#${input1Id}, #${input2Id}, #${outputId}`).ungrabify();
}

// Create a split node (1 input, 2 outputs)
function createSplitNode(x, y) {
    const nodeId = `node-${nodeIdCounter++}`;
    const inputId = `${nodeId}-in`;
    const output1Id = `${nodeId}-out1`;
    const output2Id = `${nodeId}-out2`;

    cy.add({
        group: 'nodes',
        data: {
            id: nodeId,
            label: 'split',
            type: 'compound'
        },
        position: { x, y }
    });

    cy.add({
        group: 'nodes',
        data: {
            id: inputId,
            parent: nodeId,
            type: 'input-terminal',
            terminalType: 'input'
        },
        position: { x: x - 45, y: y }
    });

    cy.add({
        group: 'nodes',
        data: {
            id: output1Id,
            parent: nodeId,
            type: 'output-terminal',
            terminalType: 'output'
        },
        position: { x: x + 45, y: y - 20 }
    });

    cy.add({
        group: 'nodes',
        data: {
            id: output2Id,
            parent: nodeId,
            type: 'output-terminal',
            terminalType: 'output'
        },
        position: { x: x + 45, y: y + 20 }
    });

    cy.$(`#${inputId}, #${output1Id}, #${output2Id}`).ungrabify();
}

// Create a nop node (1 input, 1 output)
function createNopNode(x, y) {
    const nodeId = `node-${nodeIdCounter++}`;
    const inputId = `${nodeId}-in`;
    const outputId = `${nodeId}-out`;

    cy.add({
        group: 'nodes',
        data: {
            id: nodeId,
            label: 'nop',
            type: 'compound'
        },
        position: { x, y }
    });

    cy.add({
        group: 'nodes',
        data: {
            id: inputId,
            parent: nodeId,
            type: 'input-terminal',
            terminalType: 'input'
        },
        position: { x: x - 45, y: y }
    });

    cy.add({
        group: 'nodes',
        data: {
            id: outputId,
            parent: nodeId,
            type: 'output-terminal',
            terminalType: 'output'
        },
        position: { x: x + 45, y: y }
    });

    cy.$(`#${inputId}, #${outputId}`).ungrabify();
}

// Setup sidebar drag and drop
function setupSidebarDragDrop() {
    const sidebar = document.getElementById('sidebar');
    const deleteZone = document.getElementById('deleteZone');
    const componentTemplates = document.querySelectorAll('.component-template');

    componentTemplates.forEach(template => {
        template.addEventListener('dragstart', (e) => {
            const componentType = template.getAttribute('data-component-type');
            e.dataTransfer.setData('component-type', componentType);
            e.dataTransfer.effectAllowed = 'copy';
        });
    });

    // Canvas drop zone
    const cyContainer = document.getElementById('cy');

    cyContainer.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    });

    cyContainer.addEventListener('drop', (e) => {
        e.preventDefault();
        const componentType = e.dataTransfer.getData('component-type');

        if (!componentType) return;

        // Get drop position relative to canvas container
        const cyBounds = cyContainer.getBoundingClientRect();
        const renderedX = e.clientX - cyBounds.left;
        const renderedY = e.clientY - cyBounds.top;

        // Convert rendered (screen) coordinates to model (graph) coordinates
        // Account for pan and zoom
        const pan = cy.pan();
        const zoom = cy.zoom();
        const modelX = (renderedX - pan.x) / zoom;
        const modelY = (renderedY - pan.y) / zoom;

        // Route to appropriate creation function based on component type
        switch (componentType) {
            case 'start':
                createStartNode(modelX, modelY);
                break;
            case 'stop':
                createStopNode(modelX, modelY);
                break;
            case 'plus':
                createPlusNode(modelX, modelY);
                break;
            case 'combine':
                createCombineNode(modelX, modelY);
                break;
            case 'split':
                createSplitNode(modelX, modelY);
                break;
            case 'nop':
                createNopNode(modelX, modelY);
                break;
        }
    });
}

// Setup node dragging to delete
function setupNodeDeletion() {
    const sidebar = document.getElementById('sidebar');
    const deleteZone = document.getElementById('deleteZone');
    const cyContainer = document.getElementById('cy');
    let draggedNode = null;

    cy.on('grab', 'node', function(evt) {
        draggedNode = evt.target;
    });

    cy.on('drag', 'node', function(evt) {
        const node = evt.target;
        const renderedPos = node.renderedPosition();
        const sidebarBounds = sidebar.getBoundingClientRect();
        const cyBounds = cyContainer.getBoundingClientRect();

        // Convert node position to viewport coordinates
        const nodeScreenX = cyBounds.left + renderedPos.x;

        // Check if node is over sidebar (sidebar is on the left)
        if (nodeScreenX < sidebarBounds.right) {
            deleteZone.classList.add('active');
        } else {
            deleteZone.classList.remove('active');
        }
    });

    cy.on('free', 'node', function(evt) {
        const node = evt.target;
        const renderedPos = node.renderedPosition();
        const sidebarBounds = sidebar.getBoundingClientRect();
        const cyBounds = cyContainer.getBoundingClientRect();

        // Convert node position to viewport coordinates
        const nodeScreenX = cyBounds.left + renderedPos.x;

        // Delete node if dropped in sidebar
        if (nodeScreenX < sidebarBounds.right) {
            // If it's a compound node or start/stop node, remove all children first
            if (node.data('type') === 'compound' || node.data('type') === 'start' || node.data('type') === 'stop') {
                node.children().remove();
                node.remove();
            }
            // If it's a child node (terminal), remove parent too
            else if (node.parent().length > 0) {
                const parent = node.parent();
                parent.children().remove();
                parent.remove();
            } else {
                node.remove();
            }
        }

        deleteZone.classList.remove('active');
        draggedNode = null;
    });
}

// Setup right-click edge creation/deletion
function setupEdgeCreation() {
    let isRightDragging = false;
    let sourceNode = null;
    let mousePos = { x: 0, y: 0 };

    // Prevent context menu on cytoscape canvas
    const cyContainer = document.getElementById('cy');
    cyContainer.addEventListener('contextmenu', (e) => {
        e.preventDefault();
    });

    // Track right mouse button down on node using DOM event
    cyContainer.addEventListener('mousedown', function(e) {
        if (e.button === 2) { // Right click
            // Get mouse position and check if we're on a node
            const cyBounds = cyContainer.getBoundingClientRect();
            const renderedX = e.clientX - cyBounds.left;
            const renderedY = e.clientY - cyBounds.top;

            const pan = cy.pan();
            const zoom = cy.zoom();
            const modelX = (renderedX - pan.x) / zoom;
            const modelY = (renderedY - pan.y) / zoom;

            // Find node at this position
            const elements = cy.elements().filter(function(ele) {
                if (ele.isNode()) {
                    const bb = ele.boundingBox();
                    return modelX >= bb.x1 && modelX <= bb.x2 &&
                           modelY >= bb.y1 && modelY <= bb.y2;
                }
                return false;
            });

            if (elements.length > 0) {
                // Sort by size and pick smallest
                const sorted = elements.sort(function(a, b) {
                    const aBox = a.boundingBox();
                    const bBox = b.boundingBox();
                    const aArea = (aBox.x2 - aBox.x1) * (aBox.y2 - aBox.y1);
                    const bArea = (bBox.x2 - bBox.x1) * (bBox.y2 - bBox.y1);
                    return aArea - bArea;
                });
                const node = sorted[0];

                // Only allow connections to start from output terminals
                if (node.data('terminalType') === 'output') {
                    e.preventDefault();
                    e.stopPropagation();

                    isRightDragging = true;
                    sourceNode = node;
                    mousePos = { x: modelX, y: modelY };

                    // Disable normal node dragging during right-click drag
                    cy.autoungrabify(true);
                }
            }
        }
    });

    // Track mouse movement with DOM event
    cyContainer.addEventListener('mousemove', function(e) {
        if (isRightDragging && sourceNode) {
            // Convert screen position to model position
            const cyBounds = cyContainer.getBoundingClientRect();
            const renderedX = e.clientX - cyBounds.left;
            const renderedY = e.clientY - cyBounds.top;

            const pan = cy.pan();
            const zoom = cy.zoom();
            const modelX = (renderedX - pan.x) / zoom;
            const modelY = (renderedY - pan.y) / zoom;

            // Store mouse position
            mousePos = { x: modelX, y: modelY };

            // Remove previous temp edge
            if (tempEdge) {
                cy.remove(tempEdge);
            }

            const tempTargetId = 'temp-target';

            // Remove old temp target if exists
            cy.$(`#${tempTargetId}`).remove();

            // Create invisible temp target node at cursor position
            cy.add({
                group: 'nodes',
                data: { id: tempTargetId },
                position: mousePos,
                style: { 'opacity': 0, 'width': 1, 'height': 1 }
            });

            tempEdge = cy.add({
                group: 'edges',
                data: {
                    id: 'temp-edge',
                    source: sourceNode.id(),
                    target: tempTargetId
                },
                classes: 'temp'
            });
        }
    });

    // Handle mouse up with DOM event
    cyContainer.addEventListener('mouseup', function(e) {
        if (e.button === 2 && isRightDragging) { // Right button
            // Clean up temp edge
            if (tempEdge) {
                cy.remove(tempEdge);
                tempEdge = null;
            }
            cy.$('#temp-target').remove();

            // Find what node is at the current mouse position
            const elements = cy.elements().filter(function(ele) {
                if (ele.isNode()) {
                    const bb = ele.boundingBox();
                    return mousePos.x >= bb.x1 && mousePos.x <= bb.x2 &&
                           mousePos.y >= bb.y1 && mousePos.y <= bb.y2;
                }
                return false;
            });

            // Get the top-most node (smallest one, likely a terminal or regular node)
            let targetNode = null;
            if (elements.length > 0) {
                // Sort by size (area) and pick the smallest
                const sorted = elements.sort(function(a, b) {
                    const aBox = a.boundingBox();
                    const bBox = b.boundingBox();
                    const aArea = (aBox.x2 - aBox.x1) * (aBox.y2 - aBox.y1);
                    const bArea = (bBox.x2 - bBox.x1) * (bBox.y2 - bBox.y1);
                    return aArea - bArea;
                });
                targetNode = sorted[0];
            }

            // Create or delete edge if we have a valid target
            if (sourceNode && targetNode && sourceNode.id() !== targetNode.id()) {
                // Validate edge rules:
                // 1. Source must be an output terminal
                // 2. Target must be an input terminal
                // 3. Can't connect to compound parent (start/stop)

                const sourceType = sourceNode.data('terminalType');
                const targetType = targetNode.data('terminalType');

                // Check if source is output and target is input
                if (sourceType === 'output' && targetType === 'input') {
                    // Check if edge already exists
                    const existingEdge = cy.edges(`[source="${sourceNode.id()}"][target="${targetNode.id()}"]`);

                    if (existingEdge.length > 0) {
                        // Delete existing edge
                        existingEdge.remove();
                    } else {
                        // Check if target input already has an incoming edge
                        const targetIncomingEdges = cy.edges(`[target="${targetNode.id()}"]`);

                        if (targetIncomingEdges.length > 0) {
                            // Target already has an incoming edge - reject with visual feedback
                            console.log('Input terminal already has a connection');
                            // Could add visual feedback here (flash red, etc.)
                        } else {
                            // Create new edge
                            cy.add({
                                group: 'edges',
                                data: {
                                    id: `edge-${edgeIdCounter++}`,
                                    source: sourceNode.id(),
                                    target: targetNode.id()
                                }
                            });
                        }
                    }
                } else {
                    // Invalid connection direction
                    console.log('Edges can only go from output terminals to input terminals');
                }
            }

            // Reset state
            sourceNode = null;
            isRightDragging = false;
            cy.autoungrabify(false);
        }
    });
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    initCytoscape();
    setupSidebarDragDrop();
    setupNodeDeletion();
    setupEdgeCreation();

    console.log('Interactive Graph Tool initialized');
});
