// Graph Editor Context - encapsulates all editor state for a level
import cytoscape, { Core } from 'cytoscape';
import { getCytoscapeStyles } from './styles';
import { Level } from './levels';
import { createInputNode, createOutputNode, CompNode } from './nodes';
import { ProgramCounter } from './program_counter';

// Animation stage enum - exported for use in animation.ts
export enum Stage {
    AdvanceCounter = 1,
    Evaluate
}

// Animation state interface
export class AnimationState {
    programCounters: Map<string, ProgramCounter>;
    isAnimating: boolean;
    stage: Stage;

    inputs : Array<Array<any>>
    outputs : Array<Array<any>>

    private initialInputs : Array<Array<any>>
    private initialOutputs : Array<Array<any>>

    constructor(inputs : Array<Array<any>>, outputs : Array<Array<any>>){
        this.initialInputs = inputs;
        this.initialOutputs = outputs;
        this.programCounters = new Map<string, ProgramCounter>();
        this.isAnimating = false;
        this.stage = Stage.Evaluate;
        this.inputs = [];
        this.initialInputs.forEach(_ => this.inputs.push([]))
        this.outputs = [];
        this.initialOutputs.forEach(_ => this.outputs.push([]))
        this.resetState();
    }

    resetState() {
        // Destroy old program counters if they exist
        for (const pc of this.programCounters.values()) {
            pc.destroy();
        }

        // Create a program counter for each input node
        this.programCounters = new Map<string, ProgramCounter>();
        this.stage = Stage.Evaluate;
        this.inputs.forEach(arr => arr.splice(0, this.inputs.length));
        this.initialInputs.forEach((el, index) => el.forEach(innerEl => this.inputs[index].push(innerEl)));
        this.outputs.forEach(arr => arr.splice(0, this.inputs.length));
        this.initialOutputs.forEach((el, index) => el.forEach(innerEl => this.outputs[index].push(innerEl)));

        return true;
    }
}

export class GraphEditorContext {
    public cy: Core;
    public level: Level;
    public inputNodes: CompNode[] = [];
    public outputNodes: CompNode[] = [];
    public allNodes: CompNode[] = [];
    public animationState: AnimationState;

    constructor(level: Level) {
        this.level = level;

        // Initialize animation state
        this.animationState = new AnimationState(level.inputs, level.expectedOutputs);
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
        this.animationState.inputs.forEach((inputData, index) => {
            const x = 100;
            const y = startY + (index * spacing);
            const inputNode = createInputNode(this.cy, x, y, inputData);

            // Mark as non-deletable
            inputNode.getNode().data('deletable', false);

            this.inputNodes.push(inputNode);
            this.allNodes.push(inputNode);
        });

        // Create output nodes
        this.animationState.outputs.forEach((outputs, index) => {
            const x = 700;
            const y = startY + (index * spacing);
            const outputNode = createOutputNode(this.cy, x, y, outputs);

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
        // Destroy all program counters
        for (const pc of this.animationState.programCounters.values()) {
            pc.destroy();
        }
        this.animationState.programCounters.clear();

        if (this.cy) {
            this.cy.destroy();
        }
    }
}
