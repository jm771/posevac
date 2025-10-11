// import { cy } from './global_state'

import { Core } from "cytoscape";

let nodeIdCounter = 0;

// Type definitions
export type ComponentType = 'start' | 'stop' | 'plus' | 'combine' | 'split' | 'nop';

function makeTerminals(cy: Core, nodeId: string, x: number, y: number, n: number, type: string): void {
    if (n == 0)
    {
        makeTerminals(cy, nodeId, x, y, 1, "invisible")
        return;
    }

    const minY = -60;
    const maxY = 60;

    for (let i = 0; i < n; i++)
    {
        const terminalId = `${nodeId}-${type}${i}`;
        const yOffset = ((i + 1.0) * (maxY - minY) / (n + 1.0)) + minY;
        console.log(yOffset)
        cy.add({
            group: 'nodes',
            data: {
                id: terminalId,
                parent: nodeId,
                type: `${type}-terminal`,
                terminalType: type,
                program_counter: null
            },
            position: { x: x, y: y + yOffset }
        });

        cy.$(`#${terminalId}`).ungrabify();
    }
}

function makeInputTerminals(cy: Core, nodeId: string, x: number, y: number, n: number): void {
    makeTerminals(cy, nodeId, x-50, y, n, "input")
}

function makeOutputTerminals(cy: Core, nodeId: string, x: number, y: number, n: number): void {
    makeTerminals(cy, nodeId, x+50, y, n, "output")
}

export class CompNode
{
    private inputTerminals : Array<>;
    private outputTerminals : Array<>;
    private node;
    private func : Function;

    constructor(func: Function, node, inputTerminals : Array<string>, outputTerminals : Array<string>) {
        this.inputTerminals = inputTerminals;
        this.outputTerminals = outputTerminals;
        this.func = func;
    }
}

function createNode(cy: Core, x: number, y: number, label: string, type: string, inTerminals: number, outTerminals: number, func: Function): CompNode {
    const nodeId = `node-${nodeIdCounter++}`;
        cy.add({
        group: 'nodes',
        data: {
            id: nodeId,
            label: label,
            type: type,
        },
        position: { x, y }
    });

    makeInputTerminals(cy, nodeId, x, y, inTerminals);
    makeOutputTerminals(cy, nodeId, x, y, outTerminals);
}



// Create a start node (has 1 output terminal)
export function createStartNode(cy: Core, x: number, y: number, inputs: Array<any>): void {
    inputs.reverse()
    createNode(cy, x, y, "start", "start", 0, 1, ()=>inputs.pop());
}

// Create a stop node (has 1 input terminal)
export function createStopNode(cy: Core, x: number, y: number): void {
    createNode(cy, x, y, "stop", "stop", 1, 0, (value: any)=>{console.log(value);});
}

// Create a plus node (2 inputs, 1 output)
export function createPlusNode(cy: Core, x: number, y: number): void {
    createNode(cy, x, y, "+", "compound", 2, 1, (a: any, b: any)=>a+b);
}

// Create a combine node (2 inputs, 1 output)
export function createCombineNode(cy: Core, x: number, y: number): void {
    createNode(cy, x, y, "combine", "compound", 2, 1, (a: any, b: any)=>[a, b]);
}

// Create a split node (1 input, 2 outputs)
export function createSplitNode(cy: Core, x: number, y: number): void {
    createNode(cy, x, y, "split", "compound", 1, 2, (a: any)=>a);
}

// Create a nop node (1 input, 1 output)
export function createNopNode(cy: Core, x: number, y: number): void {
    createNode(cy, x, y, "+", "compound", 1, 1, (a: any)=>a);
}