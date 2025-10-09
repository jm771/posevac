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
            // Regular node styles
            {
                selector: 'node[type="regular"]',
                style: {
                    'background-color': '#4fc3f7',
                    'width': 40,
                    'height': 40,
                    'label': 'data(label)',
                    'color': '#d4d4d4',
                    'text-valign': 'center',
                    'text-halign': 'center',
                    'font-size': 12,
                    'border-width': 3,
                    'border-color': '#4fc3f7',
                    'box-shadow': '0 0 10px rgba(79, 195, 247, 0.3)'
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
                    'text-valign': 'top',
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

    // Prevent context menu on canvas
    document.getElementById('cy').addEventListener('contextmenu', (e) => {
        e.preventDefault();
    });
}

// Create a regular node
function createRegularNode(x, y) {
    const nodeId = `node-${nodeIdCounter++}`;
    cy.add({
        group: 'nodes',
        data: {
            id: nodeId,
            label: `N${nodeIdCounter}`,
            type: 'regular'
        },
        position: { x, y }
    });
}

// Create a compound object with input/output terminals
function createCompoundObject(x, y) {
    const compoundId = `compound-${nodeIdCounter++}`;
    const input1Id = `${compoundId}-in1`;
    const input2Id = `${compoundId}-in2`;
    const outputId = `${compoundId}-out`;

    // Add compound parent node
    cy.add({
        group: 'nodes',
        data: {
            id: compoundId,
            label: `C${nodeIdCounter}`,
            type: 'compound'
        },
        position: { x, y }
    });

    // Add input terminal 1 (left side, top)
    cy.add({
        group: 'nodes',
        data: {
            id: input1Id,
            parent: compoundId,
            type: 'input-terminal',
            terminalType: 'input'
        },
        position: { x: x - 45, y: y - 20 }
    });

    // Add input terminal 2 (left side, bottom)
    cy.add({
        group: 'nodes',
        data: {
            id: input2Id,
            parent: compoundId,
            type: 'input-terminal',
            terminalType: 'input'
        },
        position: { x: x - 45, y: y + 20 }
    });

    // Add output terminal (right side, center)
    cy.add({
        group: 'nodes',
        data: {
            id: outputId,
            parent: compoundId,
            type: 'output-terminal',
            terminalType: 'output'
        },
        position: { x: x + 45, y: y }
    });

    // Make child nodes non-grabbable (they move with parent, but can't be grabbed individually)
    cy.$(`#${input1Id}, #${input2Id}, #${outputId}`).ungrabify();
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

        if (componentType === 'regular-node') {
            createRegularNode(modelX, modelY);
        } else if (componentType === 'compound-object') {
            createCompoundObject(modelX, modelY);
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
            // If it's a compound node, remove all children first
            if (node.data('type') === 'compound') {
                node.children().remove();
            }
            // If it's a child node, remove parent too
            if (node.parent().length > 0) {
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

    // Track right mouse button state
    cy.on('cxttapstart', 'node', function(evt) {
        const node = evt.target;

        // Only allow connections from terminals or regular nodes
        if (node.data('type') === 'compound') {
            return; // Can't connect to/from compound parent
        }

        isRightDragging = true;
        sourceNode = node;

        // Disable normal node dragging during right-click drag
        cy.autoungrabify(true);
    });

    cy.on('mousemove', function(evt) {
        if (isRightDragging && sourceNode) {
            // Remove previous temp edge
            if (tempEdge) {
                cy.remove(tempEdge);
            }

            // Create temporary edge to show connection
            const pos = evt.position || evt.cyPosition;
            const tempTargetId = 'temp-target';

            // Remove old temp target if exists
            cy.$(`#${tempTargetId}`).remove();

            // Create invisible temp target node
            cy.add({
                group: 'nodes',
                data: { id: tempTargetId },
                position: pos,
                style: { 'opacity': 0 }
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

    // Listen for cxttapend (right-click release) on nodes
    cy.on('cxttapend', 'node', function(evt) {
        if (isRightDragging) {
            const targetNode = evt.target;

            // Clean up temp edge
            if (tempEdge) {
                cy.remove(tempEdge);
                tempEdge = null;
            }
            cy.$('#temp-target').remove();

            // Validate connection
            if (sourceNode && targetNode && sourceNode.id() !== targetNode.id()) {
                // Can't connect to compound parent
                if (targetNode.data('type') === 'compound') {
                    sourceNode = null;
                    isRightDragging = false;
                    cy.autoungrabify(false);
                    return;
                }

                // Check if edge already exists
                const existingEdge = cy.edges(`[source="${sourceNode.id()}"][target="${targetNode.id()}"]`);

                if (existingEdge.length > 0) {
                    // Delete existing edge
                    existingEdge.remove();
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

            sourceNode = null;
            isRightDragging = false;
            cy.autoungrabify(false);
        }
    });

    // Handle right-click release outside of nodes
    cy.on('cxttapend', function(evt) {
        if (isRightDragging && evt.target === cy) {
            // Clean up temp edge
            if (tempEdge) {
                cy.remove(tempEdge);
                tempEdge = null;
            }
            cy.$('#temp-target').remove();

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
