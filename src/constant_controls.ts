// UI controls for constant nodes - text input and repeat/once toggle
import { NodeSingular } from 'cytoscape';
import { editorContext } from './global_state';

/**
 * Manages UI controls for a constant node
 */
export class ConstantControls {
    private node: NodeSingular;
    private container: HTMLDivElement;
    private input: HTMLInputElement;
    private toggleBtn: HTMLButtonElement;

    constructor(node: NodeSingular) {
        this.node = node;

        // Create container for controls
        this.container = document.createElement('div');
        this.container.className = 'constant-controls';
        this.container.style.position = 'absolute';
        this.container.style.display = 'flex';
        this.container.style.flexDirection = 'column';
        this.container.style.alignItems = 'center';
        this.container.style.gap = '4px';
        this.container.style.pointerEvents = 'auto';
        this.container.style.zIndex = '100';

        // Create text input for constant value
        this.input = document.createElement('input');
        this.input.type = 'text';
        this.input.className = 'constant-input';
        this.input.value = String(node.data('constantValue'));
        this.input.style.width = '60px';
        this.input.style.padding = '2px 4px';
        this.input.style.fontSize = '12px';
        this.input.style.textAlign = 'center';
        this.input.style.border = '1px solid #666';
        this.input.style.borderRadius = '3px';
        this.input.style.background = '#fff';

        // Create toggle button for repeat/once mode
        this.toggleBtn = document.createElement('button');
        this.toggleBtn.className = 'constant-toggle';
        this.updateToggleButton();
        this.toggleBtn.style.padding = '2px 8px';
        this.toggleBtn.style.fontSize = '10px';
        this.toggleBtn.style.border = '1px solid #666';
        this.toggleBtn.style.borderRadius = '3px';
        this.toggleBtn.style.cursor = 'pointer';
        this.toggleBtn.style.background = '#f0f0f0';

        // Add event listeners
        this.input.addEventListener('input', () => this.handleValueChange());
        this.input.addEventListener('click', (e) => e.stopPropagation());
        this.input.addEventListener('mousedown', (e) => e.stopPropagation());

        this.toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.handleToggle();
        });
        this.toggleBtn.addEventListener('mousedown', (e) => e.stopPropagation());

        // Add to container
        this.container.appendChild(this.input);
        this.container.appendChild(this.toggleBtn);

        // Add to DOM
        const cyContainer = document.getElementById('cy');
        if (cyContainer) {
            cyContainer.appendChild(this.container);
        }

        // Update position
        this.updatePosition();

        // Listen for node position changes
        this.node.on('position', () => this.updatePosition());
    }

    private handleValueChange(): void {
        const value = this.input.value;

        // Try to parse as number, otherwise keep as string
        let parsedValue: any = value;
        const numValue = Number(value);
        if (!isNaN(numValue) && value.trim() !== '') {
            parsedValue = numValue;
        }

        this.node.data('constantValue', parsedValue);
    }

    private handleToggle(): void {
        const currentRepeat = this.node.data('constantRepeat');
        this.node.data('constantRepeat', !currentRepeat);
        this.updateToggleButton();
    }

    private updateToggleButton(): void {
        const repeat = this.node.data('constantRepeat');
        this.toggleBtn.textContent = repeat ? 'repeat' : 'once';
        this.toggleBtn.style.background = repeat ? '#d0e8ff' : '#ffe8d0';
    }

    private updatePosition(): void {
        if (!editorContext) return;

        const cy = editorContext.cy;
        const pos = this.node.position();
        const zoom = cy.zoom();
        const pan = cy.pan();

        // Calculate screen position
        const x = pos.x * zoom + pan.x;
        const y = pos.y * zoom + pan.y;

        // Center the controls on the node
        this.container.style.left = `${x}px`;
        this.container.style.top = `${y - 40}px`;
        this.container.style.transform = 'translate(-50%, -50%)';
    }

    /**
     * Update control values from node data
     */
    public update(): void {
        this.input.value = String(this.node.data('constantValue'));
        this.updateToggleButton();
        this.updatePosition();
    }

    /**
     * Clean up and remove controls
     */
    public destroy(): void {
        this.node.removeListener('position');
        if (this.container.parentElement) {
            this.container.parentElement.removeChild(this.container);
        }
    }
}

// Global registry of constant controls
const constantControlsMap = new Map<string, ConstantControls>();

/**
 * Initialize controls for all constant nodes in the graph
 */
export function initializeConstantControls(): void {
    if (!editorContext) return;

    const constantNodes = editorContext.cy.nodes('[type="constant"]');

    constantNodes.forEach(node => {
        const nodeId = node.id();
        if (!constantControlsMap.has(nodeId)) {
            const controls = new ConstantControls(node as NodeSingular);
            constantControlsMap.set(nodeId, controls);
        }
    });

    // Listen for zoom/pan events to update positions
    editorContext.cy.on('zoom pan', () => {
        constantControlsMap.forEach(controls => controls.update());
    });
}

/**
 * Create controls for a specific constant node
 */
export function createConstantControls(node: NodeSingular): ConstantControls {
    const nodeId = node.id();

    // Remove existing controls if any
    if (constantControlsMap.has(nodeId)) {
        constantControlsMap.get(nodeId)!.destroy();
    }

    const controls = new ConstantControls(node);
    constantControlsMap.set(nodeId, controls);
    return controls;
}

/**
 * Remove controls for a specific node
 */
export function removeConstantControls(nodeId: string): void {
    if (constantControlsMap.has(nodeId)) {
        constantControlsMap.get(nodeId)!.destroy();
        constantControlsMap.delete(nodeId);
    }
}

/**
 * Clean up all constant controls
 */
export function destroyAllConstantControls(): void {
    constantControlsMap.forEach(controls => controls.destroy());
    constantControlsMap.clear();
}
