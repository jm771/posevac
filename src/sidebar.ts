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
                createStartNode(cy, modelX, modelY);
                break;
            case 'stop':
                createStopNode(cy, modelX, modelY);
                break;
            case 'plus':
                createPlusNode(cy, modelX, modelY);
                break;
            case 'combine':
                createCombineNode(cy, modelX, modelY);
                break;
            case 'split':
                createSplitNode(cy, modelX, modelY);
                break;
            case 'nop':
                createNopNode(cy, modelX, modelY);
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


function makePreviewCy(type: ComponentType, func: Function) : void {
    const container = document.getElementById(`preview-${type}`);

    const previewCy = cytoscape({
        container: container,
        style: getCytoscapeStyles(),
        userPanningEnabled: false,
        userZoomingEnabled: false,
        boxSelectionEnabled: false,
        autoungrabify: true
    });

    func(previewCy, 0, 0);

    previewCy.fit(undefined, 10);
}

// Create preview Cytoscape instances in sidebar
export function initializePreviews(): void {
    makePreviewCy("start", createStartNode);
    makePreviewCy("stop", createStopNode);
    makePreviewCy("plus", createPlusNode);
    makePreviewCy("combine", createCombineNode);
    makePreviewCy("split", createSplitNode);
    makePreviewCy("nop", createNopNode);
}