// Interactive Graph Tool with Cytoscape.js
// Main application logic

// Global state
let cy; // Cytoscape instance
let nodeIdCounter = 0;
let edgeIdCounter = 0;
let draggedElement = null;
let rightClickSource = null;
let tempEdge = null;

// Get shared Cytoscape styles (used for main canvas and previews)
function getCytoscapeStyles() {
    return [
        // Start node styles
        {
            selector: 'node[type="start"]',
            style: {
                'background-color': '#81c784',
                'min-width': 80,
                'min-height': 50,
                'shape': 'diamond',
                'label': 'data(label)',
                'color': 'white',
                'text-valign': 'center',
                'text-halign': 'center',
                'font-size': 12,
                'font-weight': 'bold',
                'border-width': 3,
                'border-color': '#81c784',
                'box-shadow': '0 0 10px rgba(129, 199, 132, 0.3)',
                'padding': 0,  // Allow terminals at the edges
                'compound-sizing-wrt-labels': 'include'  // Include label in size calculation
            }
        },
        // Stop node styles
        {
            selector: 'node[type="stop"]',
            style: {
                'background-color': '#e57373',
                'min-width': 80,
                'min-height': 50,
                'shape': 'diamond',
                'label': 'data(label)',
                'color': 'white',
                'text-valign': 'center',
                'text-halign': 'center',
                'font-size': 12,
                'font-weight': 'bold',
                'border-width': 3,
                'border-color': '#e57373',
                'box-shadow': '0 0 10px rgba(229, 115, 115, 0.3)',
                'padding': 0,  // Allow terminals at the edges
                'compound-sizing-wrt-labels': 'include'  // Include label in size calculation
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
                'padding': 0,  // Set to 0 to allow terminals at edges
                'min-width': 100,  // Enforce minimum width
                'min-height': 60,  // Enforce minimum height
                'shape': 'round-rectangle',
                'compound-sizing-wrt-labels': 'include',
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
    ];
}

// Initialize Cytoscape
function initCytoscape() {
    cy = cytoscape({
        container: document.getElementById('cy'),
        style: getCytoscapeStyles(),
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

    // Add output terminal (right point of diamond)
    cy.add({
        group: 'nodes',
        data: {
            id: outputId,
            parent: nodeId,
            type: 'output-terminal',
            terminalType: 'output'
        },
        position: { x: x + 40, y: y }
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

    // Add input terminal (left point of diamond)
    cy.add({
        group: 'nodes',
        data: {
            id: inputId,
            parent: nodeId,
            type: 'input-terminal',
            terminalType: 'input'
        },
        position: { x: x - 40, y: y }
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
        position: { x: x - 50, y: y - 20 }
    });

    cy.add({
        group: 'nodes',
        data: {
            id: input2Id,
            parent: nodeId,
            type: 'input-terminal',
            terminalType: 'input'
        },
        position: { x: x - 50, y: y + 20 }
    });

    cy.add({
        group: 'nodes',
        data: {
            id: outputId,
            parent: nodeId,
            type: 'output-terminal',
            terminalType: 'output'
        },
        position: { x: x + 50, y: y }
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
        position: { x: x - 50, y: y - 20 }
    });

    cy.add({
        group: 'nodes',
        data: {
            id: input2Id,
            parent: nodeId,
            type: 'input-terminal',
            terminalType: 'input'
        },
        position: { x: x - 50, y: y + 20 }
    });

    cy.add({
        group: 'nodes',
        data: {
            id: outputId,
            parent: nodeId,
            type: 'output-terminal',
            terminalType: 'output'
        },
        position: { x: x + 50, y: y }
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
        position: { x: x - 50, y: y }
    });

    cy.add({
        group: 'nodes',
        data: {
            id: output1Id,
            parent: nodeId,
            type: 'output-terminal',
            terminalType: 'output'
        },
        position: { x: x + 50, y: y - 20 }
    });

    cy.add({
        group: 'nodes',
        data: {
            id: output2Id,
            parent: nodeId,
            type: 'output-terminal',
            terminalType: 'output'
        },
        position: { x: x + 50, y: y + 20 }
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
        position: { x: x - 50, y: y }
    });

    cy.add({
        group: 'nodes',
        data: {
            id: outputId,
            parent: nodeId,
            type: 'output-terminal',
            terminalType: 'output'
        },
        position: { x: x + 50, y: y }
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

// Animation state management
let animationState = {
    currentNode: null,        // Current node the marker is at
    stepHistory: [],          // Array of nodes for backward navigation
    isAnimating: false,       // Prevent multiple animations
    arrowTipX: 0,             // Current arrow tip position (screen coords)
    arrowTipY: 0,
    currentAngle: 0,          // Current arrow angle in degrees
    arrowSvg: null,           // SVG overlay element
    arrowLine: null,          // SVG line element
    arrowHead: null,          // SVG polygon element
    pcBox: null               // PC box element
};

// Helper: Calculate PC marker position (offset above and to the side of arrow tip)
function updatePCMarkerPosition(arrowTipX, arrowTipY, arrowAngle) {
    const { arrowLine, arrowHead, pcBox } = animationState;

    if (!arrowLine || !arrowHead || !pcBox) return;

    // PC box should be offset above and to the side of the arrow tip
    // Constant offset distance from arrow tip to PC center
    const offsetDistance = 50; // pixels
    const offsetAngle = arrowAngle - 30; // 30 degrees counter-clockwise from arrow direction

    const pcCenterX = arrowTipX + offsetDistance * Math.cos(offsetAngle * Math.PI / 180);
    const pcCenterY = arrowTipY + offsetDistance * Math.sin(offsetAngle * Math.PI / 180);

    // Position the PC box (uses transform: translate(-50%, -50%) to center)
    pcBox.style.left = pcCenterX + 'px';
    pcBox.style.top = pcCenterY + 'px';
    pcBox.style.display = 'flex'; // Make visible

    // Draw arrow from PC center to arrow tip
    arrowLine.setAttribute('x1', pcCenterX);
    arrowLine.setAttribute('y1', pcCenterY);
    arrowLine.setAttribute('x2', arrowTipX);
    arrowLine.setAttribute('y2', arrowTipY);

    // Arrowhead at the tip
    const arrowheadSize = 10;
    const angle = Math.atan2(arrowTipY - pcCenterY, arrowTipX - pcCenterX);
    const x1 = arrowTipX;
    const y1 = arrowTipY;
    const x2 = arrowTipX - arrowheadSize * Math.cos(angle - Math.PI / 6);
    const y2 = arrowTipY - arrowheadSize * Math.sin(angle - Math.PI / 6);
    const x3 = arrowTipX - arrowheadSize * Math.cos(angle + Math.PI / 6);
    const y3 = arrowTipY - arrowheadSize * Math.sin(angle + Math.PI / 6);

    arrowHead.setAttribute('points', `${x1},${y1} ${x2},${y2} ${x3},${y3}`);

    // Store current arrow tip position and angle
    animationState.arrowTipX = arrowTipX;
    animationState.arrowTipY = arrowTipY;
    animationState.currentAngle = arrowAngle;
}

// Helper: Convert model coordinates to canvas-relative coordinates
// Returns coordinates relative to the canvas-container (where the SVG overlay is positioned)
function modelToScreen(modelX, modelY) {
    const pan = cy.pan();
    const zoom = cy.zoom();

    // Calculate rendered position (relative to canvas)
    const renderedX = modelX * zoom + pan.x;
    const renderedY = modelY * zoom + pan.y;

    return {
        x: renderedX,
        y: renderedY
    };
}

// Initialize animation - find start node and position marker
function initializeAnimation() {
    // Find start node
    const startNodes = cy.nodes('[type="start"]');

    if (startNodes.length === 0) {
        console.error('No start node found in graph');
        return false;
    }

    if (startNodes.length > 1) {
        console.warn('Multiple start nodes found, using first one');
    }

    const startNode = startNodes[0];
    const startPos = startNode.position();

    // Convert start node center to screen coordinates
    const screenPos = modelToScreen(startPos.x, startPos.y);

    // Initialize marker elements
    animationState.arrowSvg = document.getElementById('pcArrow');
    animationState.arrowLine = document.getElementById('pcArrowLine');
    animationState.arrowHead = document.getElementById('pcArrowHead');
    animationState.pcBox = document.getElementById('pcBox');
    animationState.currentNode = startNode;
    animationState.stepHistory = [startNode];

    // Show the SVG overlay
    animationState.arrowSvg.style.display = 'block';

    // Position arrow tip at start node center, pointing right (0 degrees)
    updatePCMarkerPosition(screenPos.x, screenPos.y, 0);

    // Update button states
    updateButtonStates();

    console.log('Animation initialized at', screenPos);

    return true;
}

// Get output terminals from a node
function getOutputTerminals(node) {
    if (!node) return [];

    // For start nodes, find the output terminal child
    if (node.data('type') === 'start' || node.data('type') === 'compound') {
        const children = node.children();
        return children.filter(child => child.data('terminalType') === 'output');
    }

    return [];
}

// Get outgoing edges from output terminals
function getOutgoingEdges(node) {
    const outputTerminals = getOutputTerminals(node);
    let edges = [];

    outputTerminals.forEach(terminal => {
        const terminalEdges = cy.edges(`[source="${terminal.id()}"]`);
        edges = edges.concat(terminalEdges.toArray());
    });

    return edges;
}

// Animate along a path with multiple waypoints
function animateAlongPath(waypoints, duration) {
    return new Promise((resolve) => {
        if (!waypoints || waypoints.length === 0) {
            console.error('No waypoints provided for animation');
            resolve();
            return;
        }

        console.log('Starting animation with', waypoints.length, 'waypoints over', duration, 'ms');

        const startTime = performance.now();
        let animationFrameId = null;

        function animate(currentTime) {
            const elapsed = currentTime - startTime;
            // Clamp progress between 0 and 1 to handle timing edge cases
            const progress = Math.min(Math.max(elapsed / duration, 0), 1);

            // Find which segment we're on
            const segmentCount = waypoints.length - 1;

            if (segmentCount <= 0) {
                // Only one waypoint (or invalid), just position there
                console.log('Single waypoint, positioning at:', waypoints[0]);
                updatePCMarkerPosition(waypoints[0].x, waypoints[0].y, waypoints[0].angle);
                resolve();
                return;
            }

            const segmentProgress = progress * segmentCount;
            const segmentIndex = Math.floor(segmentProgress);
            const localProgress = segmentProgress - segmentIndex;

            if (segmentIndex >= segmentCount) {
                // Animation complete - position at final waypoint
                const final = waypoints[waypoints.length - 1];
                console.log('Animation complete at final waypoint:', final);
                updatePCMarkerPosition(final.x, final.y, final.angle);
                resolve();
                return;
            }

            // Interpolate between current and next waypoint
            const current = waypoints[segmentIndex];
            const next = waypoints[segmentIndex + 1];

            if (!current || !next) {
                console.error('Invalid waypoint - current:', current, 'next:', next, 'index:', segmentIndex, 'total:', waypoints.length);
                console.error('All waypoints:', waypoints);
                resolve();
                return;
            }

            const x = current.x + (next.x - current.x) * localProgress;
            const y = current.y + (next.y - current.y) * localProgress;
            const angle = current.angle + (next.angle - current.angle) * localProgress;

            updatePCMarkerPosition(x, y, angle);

            if (progress < 1) {
                animationFrameId = requestAnimationFrame(animate);
            } else {
                console.log('Animation progress complete');
                resolve();
            }
        }

        animationFrameId = requestAnimationFrame(animate);
    });
}

// Step forward in animation
async function stepForward() {
    console.log('stepForward called');

    if (animationState.isAnimating) {
        console.log('Animation already in progress, ignoring');
        return;
    }

    // Initialize if needed (first time)
    if (!animationState.currentNode) {
        console.log('No current node, initializing...');
        if (!initializeAnimation()) {
            console.log('Initialization failed');
            return;
        }
        console.log('Initialization succeeded');
        // Return after initialization - user needs to click forward again to actually move
        return;
    }

    animationState.isAnimating = true;

    const currentNode = animationState.currentNode;
    console.log('Current node:', currentNode.id());

    // Get outgoing edges
    const outgoingEdges = getOutgoingEdges(currentNode);
    console.log('Outgoing edges:', outgoingEdges.length);

    if (outgoingEdges.length === 0) {
        console.log('No outgoing edges - end of path');
        animationState.isAnimating = false;
        updateButtonStates();
        return;
    }

    if (outgoingEdges.length > 1) {
        console.error('Multiple output edges detected - not supported yet');
        animationState.isAnimating = false;
        updateButtonStates();
        return;
    }

    const edge = outgoingEdges[0];
    const sourceTerminal = cy.getElementById(edge.data('source'));
    const targetTerminal = cy.getElementById(edge.data('target'));
    const targetNode = targetTerminal.parent();

    console.log('Animating from', currentNode.id(), 'to', targetNode.id());

    // Build waypoints: current center → output terminal → target terminal → target center
    const waypoints = [];

    // Current node center (where marker currently is)
    const currentPos = currentNode.position();
    const currentScreen = modelToScreen(currentPos.x, currentPos.y);
    console.log('Current position:', currentScreen);
    waypoints.push({ x: currentScreen.x, y: currentScreen.y, angle: 0 });

    // Output terminal position
    const outputPos = sourceTerminal.position();
    const outputScreen = modelToScreen(outputPos.x, outputPos.y);
    const angleToOutput = Math.atan2(outputScreen.y - currentScreen.y, outputScreen.x - currentScreen.x) * 180 / Math.PI;
    console.log('Output terminal:', outputScreen);
    waypoints.push({ x: outputScreen.x, y: outputScreen.y, angle: angleToOutput });

    // Target input terminal position
    const inputPos = targetTerminal.position();
    const inputScreen = modelToScreen(inputPos.x, inputPos.y);
    const angleAlongEdge = Math.atan2(inputScreen.y - outputScreen.y, inputScreen.x - outputScreen.x) * 180 / Math.PI;
    console.log('Input terminal:', inputScreen);
    waypoints.push({ x: inputScreen.x, y: inputScreen.y, angle: angleAlongEdge });

    // Target node center
    const targetPos = targetNode.position();
    const targetScreen = modelToScreen(targetPos.x, targetPos.y);
    const angleToCenter = Math.atan2(targetScreen.y - inputScreen.y, targetScreen.x - inputScreen.x) * 180 / Math.PI;
    console.log('Target center:', targetScreen);
    waypoints.push({ x: targetScreen.x, y: targetScreen.y, angle: angleToCenter });

    console.log('Built waypoints:', waypoints.length, waypoints);

    // Validate waypoints before animating
    for (let i = 0; i < waypoints.length; i++) {
        const wp = waypoints[i];
        if (!wp || isNaN(wp.x) || isNaN(wp.y) || isNaN(wp.angle)) {
            console.error('Invalid waypoint at index', i, ':', wp);
            animationState.isAnimating = false;
            updateButtonStates();
            return;
        }
    }

    // Animate along path
    await animateAlongPath(waypoints, 500);

    // Update state
    animationState.currentNode = targetNode;
    animationState.stepHistory.push(targetNode);
    animationState.isAnimating = false;

    console.log('Animation complete, now at:', targetNode.id());
    updateButtonStates();
}

// Step backward in animation
async function stepBackward() {
    if (animationState.isAnimating) return;
    if (animationState.stepHistory.length <= 1) return; // Can't go before start

    animationState.isAnimating = true;

    // Remove current node from history
    animationState.stepHistory.pop();
    const previousNode = animationState.stepHistory[animationState.stepHistory.length - 1];

    // Animate back to previous node
    const targetPos = previousNode.position();
    const targetScreen = modelToScreen(targetPos.x, targetPos.y);

    await animateAlongPath([
        { x: animationState.arrowTipX, y: animationState.arrowTipY, angle: 0 },
        { x: targetScreen.x, y: targetScreen.y, angle: 0 }
    ], 500);

    animationState.currentNode = previousNode;
    animationState.isAnimating = false;

    updateButtonStates();
}

// Reset animation to start
function resetAnimation() {
    if (animationState.isAnimating) return;

    initializeAnimation();
}

// Update button states based on current position
function updateButtonStates() {
    const forwardBtn = document.getElementById('forwardBtn');
    const backBtn = document.getElementById('backBtn');
    const resetBtn = document.getElementById('resetBtn');

    if (!animationState.currentNode) {
        forwardBtn.disabled = true;
        backBtn.disabled = true;
        return;
    }

    // Forward: disabled if no outgoing edges
    const outgoingEdges = getOutgoingEdges(animationState.currentNode);
    forwardBtn.disabled = outgoingEdges.length === 0;

    // Back: disabled if at start
    backBtn.disabled = animationState.stepHistory.length <= 1;
}

// Update PC marker position when viewport changes (pan/zoom) or nodes move
function updatePCMarkerForViewportChange() {
    // Only update if animation is initialized and not currently animating
    if (!animationState.currentNode || !animationState.pcBox || animationState.isAnimating) {
        return;
    }

    // Recalculate the position based on current node's current position
    const currentPos = animationState.currentNode.position();
    const screenPos = modelToScreen(currentPos.x, currentPos.y);

    // Update marker to point at current node, preserving the current angle
    updatePCMarkerPosition(screenPos.x, screenPos.y, animationState.currentAngle);
}

// Setup animation controls
function setupAnimationControls() {
    const forwardBtn = document.getElementById('forwardBtn');
    const backBtn = document.getElementById('backBtn');
    const resetBtn = document.getElementById('resetBtn');

    forwardBtn.addEventListener('click', stepForward);
    backBtn.addEventListener('click', stepBackward);
    resetBtn.addEventListener('click', resetAnimation);

    // Listen for viewport changes (pan/zoom)
    cy.on('pan zoom', updatePCMarkerForViewportChange);

    // Listen for node position changes (when user drags nodes)
    cy.on('position', 'node', updatePCMarkerForViewportChange);

    // Don't initialize until user clicks - they need to add nodes first
    // Initialize will happen automatically on first forward click
}

// Create preview Cytoscape instances in sidebar
function initializePreviews() {
    const previewTypes = ['start', 'stop', 'plus', 'combine', 'split', 'nop'];

    previewTypes.forEach(type => {
        const container = document.getElementById(`preview-${type}`);
        if (!container) return;

        const previewCy = cytoscape({
            container: container,
            style: getCytoscapeStyles(),
            userPanningEnabled: false,
            userZoomingEnabled: false,
            boxSelectionEnabled: false,
            autoungrabify: true
        });

        // Create the appropriate node type in the preview
        switch (type) {
            case 'start':
                previewCy.add([
                    { group: 'nodes', data: { id: 'node', label: 'start', type: 'start' }, position: { x: 0, y: 0 } },
                    { group: 'nodes', data: { id: 'out', parent: 'node', type: 'output-terminal', terminalType: 'output' }, position: { x: 40, y: 0 } }
                ]);
                break;
            case 'stop':
                previewCy.add([
                    { group: 'nodes', data: { id: 'node', label: 'stop', type: 'stop' }, position: { x: 0, y: 0 } },
                    { group: 'nodes', data: { id: 'in', parent: 'node', type: 'input-terminal', terminalType: 'input' }, position: { x: -40, y: 0 } }
                ]);
                break;
            case 'plus':
                previewCy.add([
                    { group: 'nodes', data: { id: 'node', label: '+', type: 'compound' }, position: { x: 0, y: 0 } },
                    { group: 'nodes', data: { id: 'in1', parent: 'node', type: 'input-terminal', terminalType: 'input' }, position: { x: -50, y: -20 } },
                    { group: 'nodes', data: { id: 'in2', parent: 'node', type: 'input-terminal', terminalType: 'input' }, position: { x: -50, y: 20 } },
                    { group: 'nodes', data: { id: 'out', parent: 'node', type: 'output-terminal', terminalType: 'output' }, position: { x: 50, y: 0 } }
                ]);
                break;
            case 'combine':
                previewCy.add([
                    { group: 'nodes', data: { id: 'node', label: 'combine', type: 'compound' }, position: { x: 0, y: 0 } },
                    { group: 'nodes', data: { id: 'in1', parent: 'node', type: 'input-terminal', terminalType: 'input' }, position: { x: -50, y: -20 } },
                    { group: 'nodes', data: { id: 'in2', parent: 'node', type: 'input-terminal', terminalType: 'input' }, position: { x: -50, y: 20 } },
                    { group: 'nodes', data: { id: 'out', parent: 'node', type: 'output-terminal', terminalType: 'output' }, position: { x: 50, y: 0 } }
                ]);
                break;
            case 'split':
                previewCy.add([
                    { group: 'nodes', data: { id: 'node', label: 'split', type: 'compound' }, position: { x: 0, y: 0 } },
                    { group: 'nodes', data: { id: 'in', parent: 'node', type: 'input-terminal', terminalType: 'input' }, position: { x: -50, y: 0 } },
                    { group: 'nodes', data: { id: 'out1', parent: 'node', type: 'output-terminal', terminalType: 'output' }, position: { x: 50, y: -20 } },
                    { group: 'nodes', data: { id: 'out2', parent: 'node', type: 'output-terminal', terminalType: 'output' }, position: { x: 50, y: 20 } }
                ]);
                break;
            case 'nop':
                previewCy.add([
                    { group: 'nodes', data: { id: 'node', label: 'nop', type: 'compound' }, position: { x: 0, y: 0 } },
                    { group: 'nodes', data: { id: 'in', parent: 'node', type: 'input-terminal', terminalType: 'input' }, position: { x: -50, y: 0 } },
                    { group: 'nodes', data: { id: 'out', parent: 'node', type: 'output-terminal', terminalType: 'output' }, position: { x: 50, y: 0 } }
                ]);
                break;
        }

        // Fit the preview to show the entire node
        previewCy.fit(null, 10);
    });
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    initCytoscape();
    initializePreviews();
    setupSidebarDragDrop();
    setupNodeDeletion();
    setupEdgeCreation();
    setupAnimationControls();

    console.log('Interactive Graph Tool initialized');
});
