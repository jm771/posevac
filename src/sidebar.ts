import cytoscape from 'cytoscape';
import { getCytoscapeStyles } from './styles';
import { CompNode, createPlusNode, createMultiplyNode, createCombineNode, createSplitNode, createNopNode, createConstantNode, Resetable } from './nodes';
import { ComponentType } from './levels';
import { GraphEditorContext, LevelContext, NodeBuildContext } from './editor_context';
import { createConstantControls, removeConstantControls } from './constant_controls';


function addComponentToSidebar(type: ComponentType, func: (context: NodeBuildContext, x: number, y: number) => CompNode) : void {
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

        let context : NodeBuildContext = {cy : previewCy, nodeIdCounter : 0, resetables : new Map<string, Resetable>()};

        func(context, 0, 0);

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
const COMPONENT_REGISTRY: { type: ComponentType, createFunc: (context: NodeBuildContext, x: number, y: number) => CompNode }[] = [
    { type: 'plus', createFunc: createPlusNode },
    { type: 'multiply', createFunc: createMultiplyNode },
    { type: 'combine', createFunc: createCombineNode },
    { type: 'split', createFunc: createSplitNode },
    { type: 'nop', createFunc: createNopNode },
    { type: 'constant', createFunc: createConstantNode },
];

// Setup sidebar drag and drop
export function setupSidebarDragDrop(context: GraphEditorContext): void {
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

        const cyBounds = cyContainer.getBoundingClientRect();
        const renderedX = e.clientX - cyBounds.left;
        const renderedY = e.clientY - cyBounds.top;

        const pan = context.cy.pan();
        const zoom = context.cy.zoom();
        const modelX = (renderedX - pan.x) / zoom;
        const modelY = (renderedY - pan.y) / zoom;

        const component = COMPONENT_REGISTRY.find(c => c.type === componentType);
        if (component) {
            const newNode = component.createFunc(context, modelX, modelY);
            context.allNodes.push(newNode);

            // Create controls for constant nodes
            if (componentType === 'constant') {
                createConstantControls(newNode.node);
            }
        }
    });
}

// Setup node dragging to delete
export function setupNodeDeletion(levelContext : LevelContext): void {
    const context = levelContext.editorContex
    const sidebar = document.getElementById('sidebar');
    const deleteZone = document.getElementById('deleteZone');
    const cyContainer = document.getElementById('cy');
    if (!sidebar || !deleteZone || !cyContainer) return;

    context.cy.on('drag', 'node', function(evt) {
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

    context.cy.on('free', 'node', function(evt) {
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

            const nodeId = node.id();

            // Remove constant controls if it's a constant node
            if (nodeType === 'constant') {
                removeConstantControls(nodeId);
            }

            // Remove from userNodes array
            const nodeIndex = context.allNodes.findIndex(n => n.getNodeId() === nodeId);
            if (nodeIndex !== -1) {
                context.allNodes.splice(nodeIndex, 1);
                console.log(`Removed node from context. Total user nodes: ${context.allNodes.length}`);
            }

            // If it's a compound node or input/output node or constant node, remove all children first
            if (nodeType === 'compound' || nodeType === 'input' || nodeType === 'output' || nodeType === 'constant') {
                node.children().remove();
                node.remove();
            }
            // If it's a child node (terminal), remove parent too
            else if (node.parent().length > 0) {
                const parent = node.parent();
                const parentId = parent.id();

                // Remove parent from userNodes array
                const parentIndex = context.allNodes.findIndex(n => n.getNodeId() === parentId);
                if (parentIndex !== -1) {
                    context.allNodes.splice(parentIndex, 1);
                    console.log(`Removed parent node from context. Total user nodes: ${context.allNodes.length}`);
                }

                parent.children().remove();
                parent.remove();
            } else {
                node.remove();
            }
        }

        deleteZone.classList.remove('active');
    });
}


