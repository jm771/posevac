import cytoscape from 'cytoscape';
import { getCytoscapeStyles } from './styles';
import { CompNode, createPlusNode, createCombineNode, createSplitNode, createNopNode } from './nodes';
import { ComponentType } from './levels';
import { Core } from 'cytoscape';


function addComponentToSidebar(type: ComponentType, func: Function) : void {
    const componentsList = document.querySelector('.components-list');
    if (componentsList == null) {
            throw new Error("components-list missing from html");
    }

    const div = document.createElement('div');
    div.className = 'component-template';
    div.setAttribute('data-component-type', type);
    div.id = `preview-${type}`;
    div.draggable = true;
    componentsList.appendChild(div);

    // Wait for the div to be rendered and have dimensions before initializing cytoscape
    requestAnimationFrame(() => {
        const previewCy = cytoscape({
            container: div,
            style: getCytoscapeStyles(),
            userPanningEnabled: false,
            userZoomingEnabled: false,
            boxSelectionEnabled: false,
            autoungrabify: true
        });

        func(previewCy, 0, 0);

        previewCy.fit(undefined, 10);
    });
}

// Create preview Cytoscape instances in sidebar
export function initializePreviews(allowedNodes?: ComponentType[]): void {
    // Clear existing components
    const componentsList = document.querySelector('.components-list');
    if (componentsList) {
        componentsList.innerHTML = '';
    }

    // Filter registry by allowed nodes if specified
    const componentsToShow = allowedNodes
        ? COMPONENT_REGISTRY.filter(({ type }) => allowedNodes.includes(type))
        : COMPONENT_REGISTRY;

    componentsToShow.forEach(({ type, createFunc }) => {
        addComponentToSidebar(type, createFunc);
    });
}

// Component registry - single source of truth for all component types
// Note: input/output nodes are NOT in this registry - they are auto-created per level
const COMPONENT_REGISTRY: { type: ComponentType, createFunc: (cy: Core, x: number, y: number) => CompNode }[] = [
    { type: 'plus', createFunc: createPlusNode },
    { type: 'combine', createFunc: createCombineNode },
    { type: 'split', createFunc: createSplitNode },
    { type: 'nop', createFunc: createNopNode },
];

// Setup sidebar drag and drop
export function setupSidebarDragDrop(cy: Core): void {
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
        const component = COMPONENT_REGISTRY.find(c => c.type === componentType);
        if (component) {
            component.createFunc(cy, modelX, modelY);
        }
    });
}

// Setup node dragging to delete
export function setupNodeDeletion(cy: Core): void {
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
            // Check if node is deletable (input/output nodes are not deletable)
            const isDeletable = node.data('deletable') !== false;

            if (!isDeletable) {
                console.log('This node cannot be deleted');
                deleteZone.classList.remove('active');
                return;
            }

            // If it's a compound node or input/output node, remove all children first
            if (nodeType === 'compound' || nodeType === 'input' || nodeType === 'output') {
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


