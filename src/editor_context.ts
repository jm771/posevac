// Graph Editor Context - encapsulates all editor state for a level
import cytoscape, { Core } from 'cytoscape';
import { getCytoscapeStyles } from './styles';
import { Level } from './levels';
import { createInputNode, createOutputNode, CompNode } from './nodes';

export class GraphEditorContext {
    public cy: Core;
    public level: Level;
    public inputNodes: CompNode[] = [];
    public outputNodes: CompNode[] = [];
    public allNodes: CompNode[] = [];

    constructor(level: Level) {
        this.level = level;

        // Initialize Cytoscape
        const container = document.getElementById('cy');
        if (!container) {
            throw new Error('Cytoscape container element not found');
        }

        this.cy = cytoscape({
            container: container,
            style: getCytoscapeStyles(),
            layout: {
                name: 'preset'
            },
            // Interaction settings
            minZoom: 0.5,
            maxZoom: 2,
            // Disable default behaviors we'll implement custom
            autoungrabify: false,
            userPanningEnabled: true,
            userZoomingEnabled: true,
            boxSelectionEnabled: false
        });

        // Create input and output nodes
        this.initializeInputOutputNodes();
    }

    /**
     * Create input and output nodes based on level configuration
     */
    private initializeInputOutputNodes(): void {
        const spacing = 150;
        const startY = 100;

        // Create input nodes
        this.level.inputs.forEach((inputData, index) => {
            const x = 100;
            const y = startY + (index * spacing);
            const inputNode = createInputNode(this.cy, x, y, [...inputData]);

            // Mark as non-deletable
            inputNode.getNode().data('deletable', false);

            this.inputNodes.push(inputNode);
            this.allNodes.push(inputNode);
        });

        // Create output nodes
        this.level.expectedOutputs.forEach((outputs, index) => {
            const x = 700;
            const y = startY + (index * spacing);
            const outputNode = createOutputNode(this.cy, x, y, [...outputs]);

            // Mark as non-deletable
            outputNode.getNode().data('deletable', false);

            this.outputNodes.push(outputNode);
            this.allNodes.push(outputNode);
        });
    }

    /**
     * Clean up and destroy this editor context
     */
    destroy(): void {
        if (this.cy) {
            this.cy.destroy();
        }
    }
}
