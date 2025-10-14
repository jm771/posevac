// UI controls for constant nodes - click-to-edit approach (similar to edge editor)
import { NodeSingular } from 'cytoscape';
import { editorContext } from './global_state';

let currentConstantInput: HTMLInputElement | null = null;
let currentEditingNode: NodeSingular | null = null;

/**
 * Initialize constant node editing functionality
 */
export function initializeConstantControls(): void {
    if (!editorContext) return;

    const cy = editorContext.cy;

    // Click on constant node to edit
    cy.on('tap', 'node[type="constant"]', (evt) => {
        const node = evt.target as NodeSingular;
        showConstantEditor(node);
    });

    // Click on background to close any open editor
    cy.on('tap', (evt) => {
        if (evt.target === cy) {
            closeConstantEditor();
        }
    });

    // Click on other nodes to close editor
    cy.on('tap', 'node', (evt) => {
        const node = evt.target as NodeSingular;
        if (node.data('type') !== 'constant') {
            closeConstantEditor();
        }
    });

    // Update node labels when data changes
    cy.on('data', 'node[type="constant"]', (evt) => {
        const node = evt.target as NodeSingular;
        updateNodeLabel(node);
    });

    // Initialize labels for existing constant nodes
    cy.nodes('[type="constant"]').forEach((node: NodeSingular) => {
        updateNodeLabel(node);
    });
}

/**
 * Update the label of a constant node to show its value and mode
 */
function updateNodeLabel(node: NodeSingular): void {
    const value = node.data('constantValue') !== undefined ? node.data('constantValue') : 0;
    const repeat = node.data('constantRepeat') !== undefined ? node.data('constantRepeat') : true;
    const modeText = repeat ? '∞' : '1×';
    node.data('label', `${value} ${modeText}`);
}

/**
 * Show editor for constant node (input + toggle button)
 */
function showConstantEditor(node: NodeSingular): void {
    if (!editorContext) return;

    // Close any existing editor
    closeConstantEditor();

    currentEditingNode = node;

    // Get current values
    const currentValue = node.data('constantValue') !== undefined ? node.data('constantValue') : 0;
    const currentRepeat = node.data('constantRepeat') !== undefined ? node.data('constantRepeat') : true;

    // Create container div
    const container = document.createElement('div');
    container.className = 'constant-editor-container';
    container.style.position = 'absolute';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '4px';
    container.style.alignItems = 'center';
    container.style.zIndex = '1000';

    // Create input element for value
    const input = document.createElement('input');
    input.type = 'text';
    input.value = String(currentValue);
    input.className = 'constant-value-input';
    input.style.padding = '4px 8px';
    input.style.fontSize = '14px';
    input.style.fontWeight = 'bold';
    input.style.textAlign = 'center';
    input.style.border = '2px solid #64b5f6';
    input.style.borderRadius = '4px';
    input.style.background = '#fff';
    input.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
    input.style.width = '80px';

    // Create toggle button for repeat/once mode
    const toggle = document.createElement('button');
    toggle.className = 'constant-toggle-button';
    toggle.textContent = currentRepeat ? 'REPEAT' : 'ONCE';
    toggle.style.padding = '3px 8px';
    toggle.style.fontSize = '10px';
    toggle.style.fontWeight = 'bold';
    toggle.style.border = '1px solid #64b5f6';
    toggle.style.borderRadius = '3px';
    toggle.style.cursor = 'pointer';
    toggle.style.background = currentRepeat ? '#64b5f6' : '#ffb74d';
    toggle.style.color = '#fff';
    toggle.style.boxShadow = '0 1px 2px rgba(0,0,0,0.2)';

    container.appendChild(input);
    container.appendChild(toggle);

    // Position the editor over the node
    updateEditorPosition(container, node);

    // Add to DOM
    const cyContainer = document.getElementById('cy');
    if (cyContainer) {
        cyContainer.appendChild(container);
        currentConstantInput = input;
        input.focus();
        input.select();
    }

    // Handle input changes
    input.addEventListener('input', () => {
        let parsedValue: any = input.value;
        const numValue = Number(input.value);
        if (!isNaN(numValue) && input.value.trim() !== '') {
            parsedValue = numValue;
        }
        node.data('constantValue', parsedValue);
    });

    // Handle toggle button click
    toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const newRepeat = !node.data('constantRepeat');
        node.data('constantRepeat', newRepeat);
        toggle.textContent = newRepeat ? 'REPEAT' : 'ONCE';
        toggle.style.background = newRepeat ? '#64b5f6' : '#ffb74d';
    });

    // Handle blur - close the editor
    input.addEventListener('blur', () => {
        setTimeout(() => {
            // Only close if we're not clicking the toggle button
            if (document.activeElement !== toggle) {
                closeConstantEditor();
            }
        }, 100);
    });

    // Handle Enter key - close the editor
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            closeConstantEditor();
        } else if (e.key === 'Escape') {
            // Restore original values on Escape
            node.data('constantValue', currentValue);
            node.data('constantRepeat', currentRepeat);
            closeConstantEditor();
        }
    });

    // Prevent clicks on editor from propagating
    container.addEventListener('mousedown', (e) => e.stopPropagation());
    container.addEventListener('click', (e) => e.stopPropagation());

    // Update position on zoom/pan/drag
    const updateHandler = () => updateEditorPosition(container, node);
    editorContext.cy.on('zoom pan viewport drag', updateHandler);

    // Store handler for cleanup
    (container as any)._updateHandler = updateHandler;
}

/**
 * Update editor position to match node position
 */
function updateEditorPosition(container: HTMLElement, node: NodeSingular): void {
    if (!editorContext) return;

    const cy = editorContext.cy;

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
    container.style.transform = 'translate(-50%, -50%)';
}

/**
 * Close the constant editor
 */
function closeConstantEditor(): void {
    if (currentConstantInput && currentConstantInput.parentElement) {
        const container = currentConstantInput.parentElement;

        // Remove zoom/pan listener
        if (editorContext && (container as any)._updateHandler) {
            editorContext.cy.off('zoom pan viewport drag', (container as any)._updateHandler);
        }

        // Remove from DOM
        if (container.parentElement) {
            container.parentElement.removeChild(container);
        }
    }

    currentConstantInput = null;
    currentEditingNode = null;
}

/**
 * Create/update controls for a specific constant node
 */
export function createConstantControls(node: NodeSingular): void {
    // Just update the label
    updateNodeLabel(node);
}

/**
 * Remove controls for a specific node
 */
export function removeConstantControls(_nodeId: string): void {
    // Close editor if this node is being edited
    if (currentEditingNode && currentEditingNode.id() === _nodeId) {
        closeConstantEditor();
    }
}

/**
 * Clean up all constant controls
 */
export function destroyAllConstantControls(): void {
    closeConstantEditor();
}
