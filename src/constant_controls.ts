// UI controls for constant nodes - text input and repeat/once toggle
// Uses cytoscape-node-html-label extension
import { NodeSingular } from 'cytoscape';
import { editorContext } from './global_state';

/**
 * Initialize HTML labels for all constant nodes
 * This uses the cytoscape-node-html-label extension
 */
export function initializeConstantControls(): void {
    if (!editorContext) return;

    // @ts-ignore - nodeHtmlLabel is added by extension
    editorContext.cy.nodeHtmlLabel([{
        query: 'node[type="constant"]',
        halign: 'center',
        valign: 'center',
        halignBox: 'center',
        valignBox: 'center',
        cssClass: 'constant-node-label',
        tpl: function(data: any) {
            const value = data.constantValue !== undefined ? data.constantValue : 0;
            const repeat = data.constantRepeat !== undefined ? data.constantRepeat : true;
            const nodeId = data.id;

            return `
                <div class="constant-controls" data-node-id="${nodeId}" style="
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 4px;
                    pointer-events: auto;
                ">
                    <input
                        type="text"
                        class="constant-input"
                        value="${value}"
                        data-node-id="${nodeId}"
                        style="
                            width: 70px;
                            padding: 4px 6px;
                            font-size: 14px;
                            font-weight: bold;
                            text-align: center;
                            border: 2px solid #64b5f6;
                            border-radius: 4px;
                            background: #fff;
                            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                        "
                    />
                    <button
                        class="constant-toggle"
                        data-node-id="${nodeId}"
                        style="
                            padding: 2px 6px;
                            font-size: 9px;
                            font-weight: bold;
                            border: 1px solid #64b5f6;
                            border-radius: 3px;
                            cursor: pointer;
                            box-shadow: 0 1px 2px rgba(0,0,0,0.2);
                            background: ${repeat ? '#64b5f6' : '#ffb74d'};
                            color: #fff;
                        "
                    >${repeat ? 'REPEAT' : 'ONCE'}</button>
                </div>
            `;
        }
    }]);

    // Set up event delegation for inputs and buttons
    setupEventDelegation();
}

/**
 * Set up event delegation for constant control interactions
 */
function setupEventDelegation(): void {
    if (!editorContext) return;

    const cyContainer = document.getElementById('cy');
    if (!cyContainer) return;

    // Handle input changes
    cyContainer.addEventListener('input', (e: Event) => {
        const target = e.target as HTMLInputElement;
        if (target.classList.contains('constant-input')) {
            const nodeId = target.getAttribute('data-node-id');
            if (nodeId) {
                const value = target.value;

                // Try to parse as number, otherwise keep as string
                let parsedValue: any = value;
                const numValue = Number(value);
                if (!isNaN(numValue) && value.trim() !== '') {
                    parsedValue = numValue;
                }

                if (editorContext) {
                    const node = editorContext.cy.$id(nodeId);
                    if (node.length > 0) {
                        node.data('constantValue', parsedValue);
                    }
                }
            }
        }
    });

    // Handle button clicks
    cyContainer.addEventListener('click', (e: Event) => {
        const target = e.target as HTMLButtonElement;
        if (target.classList.contains('constant-toggle')) {
            e.stopPropagation();

            const nodeId = target.getAttribute('data-node-id');
            if (nodeId && editorContext) {
                const node = editorContext.cy.$id(nodeId);
                if (node.length > 0) {
                    const currentRepeat = node.data('constantRepeat');
                    node.data('constantRepeat', !currentRepeat);

                    // Update button appearance
                    const newRepeat = !currentRepeat;
                    target.textContent = newRepeat ? 'REPEAT' : 'ONCE';
                    target.style.background = newRepeat ? '#64b5f6' : '#ffb74d';
                }
            }
        }
    });

    // Prevent input/button clicks from triggering node selection
    cyContainer.addEventListener('mousedown', (e: Event) => {
        const target = e.target as HTMLElement;
        if (target.classList.contains('constant-input') || target.classList.contains('constant-toggle')) {
            e.stopPropagation();
        }
    });
}

/**
 * Create/update controls for a specific constant node
 */
export function createConstantControls(_node: NodeSingular): void {
    // With node-html-label, we just need to trigger a refresh
    // The extension will automatically create the label
    if (editorContext) {
        // @ts-ignore
        editorContext.cy.nodeHtmlLabel('refresh');
    }
}

/**
 * Remove controls for a specific node
 */
export function removeConstantControls(_nodeId: string): void {
    // With node-html-label, labels are automatically removed when nodes are removed
    // No manual cleanup needed
}

/**
 * Clean up all constant controls
 */
export function destroyAllConstantControls(): void {
    // With node-html-label, labels are automatically managed
    // No manual cleanup needed
}
