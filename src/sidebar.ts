import cytoscape from 'cytoscape';
import { cy } from './global_state'
import { getCytoscapeStyles } from './styles';
import { ComponentType, createStartNode, createStopNode, createPlusNode, createCombineNode, createSplitNode, createNopNode } from './nodes';

// Setup sidebar drag and drop
export function setupSidebarDragDrop(): void {
    const componentTemplates = document.querySelectorAll<HTMLElement>('.component-template');

    componentTemplates.forEach(template => {
        template.addEventListener('dragstart', (e: DragEvent) => {
            const componentType = template.getAttribute('data-component-type');
            if (e.dataTransfer && componentType) {
                e.dataTransfer.setData('component-type', componentType);
                e.dataTransfer.effectAllowed = 'copy';
            }
        });
    });

    // Canvas drop zone
    const cyContainer = document.getElementById('cy');
    if (!cyContainer) return;

    cyContainer.addEventListener('dragover', (e: DragEvent) => {
        e.preventDefault();
        if (e.dataTransfer) {
            e.dataTransfer.dropEffect = 'copy';
        }
    });

    cyContainer.addEventListener('drop', (e: DragEvent) => {
        e.preventDefault();
        if (!e.dataTransfer) return;

        const componentType = e.dataTransfer.getData('component-type') as ComponentType;
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
export function setupNodeDeletion(): void {
    const sidebar = document.getElementById('sidebar');
    const deleteZone = document.getElementById('deleteZone');
    const cyContainer = document.getElementById('cy');
    if (!sidebar || !deleteZone || !cyContainer) return;

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
            const nodeType = node.data('type');
            // If it's a compound node or start/stop node, remove all children first
            if (nodeType === 'compound' || nodeType === 'start' || nodeType === 'stop') {
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
    });
}


// Create preview Cytoscape instances in sidebar
export function initializePreviews(): void {
    const previewTypes: ComponentType[] = ['start', 'stop', 'plus', 'combine', 'split', 'nop'];

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
        previewCy.fit(undefined, 10);
    });
}

// Update button states based on current position
function updateButtonStates(): void {
    const forwardBtn = document.getElementById('forwardBtn') as HTMLButtonElement | null;
    const backBtn = document.getElementById('backBtn') as HTMLButtonElement | null;

    if (!forwardBtn || !backBtn) return;

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