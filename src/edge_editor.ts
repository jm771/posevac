import { EdgeSingular, Core } from 'cytoscape';

// TODO remove this too
let currentEdgeInput: HTMLInputElement | null = null;

export function initializeEdgeEditor(cy: Core): void {
    // Click on edge to edit condition
    cy.on('tap', 'edge', (evt) => {
        const edge = evt.target as EdgeSingular;
        showEdgeConditionInput(cy, edge);
    });

    // Click on background to close any open editor
    cy.on('tap', (evt) => {
        if (evt.target === cy) {
            closeEdgeConditionInput(cy);
        }
    });

    // Also close when clicking on nodes
    cy.on('tap', 'node', () => {
        closeEdgeConditionInput(cy);
    });
}

function showEdgeConditionInput(cy: Core, edge: EdgeSingular): void {
    // Close any existing input
    closeEdgeConditionInput(cy);

    // Get current condition value
    const currentCondition = edge.data('condition') || '';

    // Create input element
    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentCondition;
    input.placeholder = 'condition...';
    input.className = 'edge-condition-input';

    // Styling
    input.style.position = 'absolute';
    input.style.padding = '4px 8px';
    input.style.fontSize = '12px';
    input.style.border = '2px solid #4fc3f7';
    input.style.borderRadius = '3px';
    input.style.background = '#fff';
    input.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
    input.style.zIndex = '1000';
    input.style.minWidth = '100px';

    // Position the input at the edge midpoint
    updateInputPosition(cy, input, edge);

    // Add to DOM
    const cyContainer = document.getElementById('cy');
    if (cyContainer) {
        cyContainer.appendChild(input);
        currentEdgeInput = input;
        input.focus();
        input.select();
    }

    // Handle input changes
    input.addEventListener('input', () => {
        edge.data('condition', input.value);
    });

    // Handle blur - close the input
    input.addEventListener('blur', () => {
        setTimeout(() => closeEdgeConditionInput(cy), 100);
    });

    // Handle Enter key - close the input
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            input.blur();
        } else if (e.key === 'Escape') {
            // Restore original value on Escape
            edge.data('condition', currentCondition);
            input.blur();
        }
    });

    // Prevent clicks on input from propagating
    input.addEventListener('mousedown', (e) => e.stopPropagation());
    input.addEventListener('click', (e) => e.stopPropagation());

    // Update position on zoom/pan
    const updateHandler = () => updateInputPosition(cy, input, edge);
    cy.on('zoom pan viewport', updateHandler);

    // Store handler for cleanup
    (input as any)._updateHandler = updateHandler;
}


function updateInputPosition(cy: Core, input: HTMLInputElement, edge: EdgeSingular): void {
    // Get edge midpoint in model coordinates
    const sourcePos = edge.source().position();
    const targetPos = edge.target().position();
    const midX = (sourcePos.x + targetPos.x) / 2;
    const midY = (sourcePos.y + targetPos.y) / 2;

    // Convert to rendered coordinates
    const zoom = cy.zoom();
    const pan = cy.pan();
    const renderedX = midX * zoom + pan.x;
    const renderedY = midY * zoom + pan.y;

    // Position input
    input.style.left = `${renderedX}px`;
    input.style.top = `${renderedY}px`;
    input.style.transform = 'translate(-50%, -50%)';
}

function closeEdgeConditionInput(cy: Core): void {
    if (currentEdgeInput) {
        // Remove zoom/pan listener
        if ((currentEdgeInput as any)._updateHandler) {
            cy.off('zoom pan viewport', (currentEdgeInput as any)._updateHandler);
        }

        // Remove from DOM
        if (currentEdgeInput.parentElement) {
            currentEdgeInput.parentElement.removeChild(currentEdgeInput);
        }
        currentEdgeInput = null;
    }
}
