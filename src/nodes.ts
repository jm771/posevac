// import { cy } from './global_state'

import { Core, NodeSingular } from "cytoscape";
import { ProgramCounter } from "./program_counter";

let nodeIdCounter = 0;

// Type definitions
export type ComponentType = 'input' | 'output' | 'plus' | 'combine' | 'split' | 'nop';

function makeTerminals(cy: Core, nodeId: string, x: number, y: number, n: number, type: string): NodeSingular[] {
    if (n == 0)
    {
        return makeTerminals(cy, nodeId, x, y, 1, "invisible");
    }

    const minY = -60;
    const maxY = 60;
    const terminals: NodeSingular[] = [];

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

        const terminal = cy.$(`#${terminalId}`) as NodeSingular;
        terminal.ungrabify();
        terminals.push(terminal);
    }

    return terminals;
}

function makeInputTerminals(cy: Core, nodeId: string, x: number, y: number, n: number): NodeSingular[] {
    return makeTerminals(cy, nodeId, x-50, y, n, "input");
}

function makeOutputTerminals(cy: Core, nodeId: string, x: number, y: number, n: number): NodeSingular[] {
    return makeTerminals(cy, nodeId, x+50, y, n, "output");
}

export class CompNode
{
    private inputTerminals: NodeSingular[];
    private outputTerminals: NodeSingular[];
    private node: NodeSingular;
    private func: Function;

    constructor(func: Function, node: NodeSingular, inputTerminals: NodeSingular[], outputTerminals: NodeSingular[]) {
        this.inputTerminals = inputTerminals;
        this.outputTerminals = outputTerminals;
        this.node = node;
        this.func = func;
    }

    getNode(): NodeSingular {
        return this.node;
    }

    getNodeId(): string {
        return this.node.id();
    }

    getInputTerminals(): NodeSingular[] {
        return this.inputTerminals;
    }

    getOutputTerminals(): NodeSingular[] {
        return this.outputTerminals;
    }

    getFunction(): Function {
        return this.func;
    }
    
    evaluate(programCounters: Map<string, ProgramCounter>) : void
    {
        programCounters;   
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

    // Get the created node
    const node = cy.$(`#${nodeId}`) as NodeSingular;

    // Create terminals and collect references
    const inputTerminals = makeInputTerminals(cy, nodeId, x, y, inTerminals);
    const outputTerminals = makeOutputTerminals(cy, nodeId, x, y, outTerminals);

    // Construct and return CompNode
    return new CompNode(func, node, inputTerminals, outputTerminals);
}



// Create an input node (has 1 output terminal)
export function createInputNode(cy: Core, x: number, y: number, inputs: Array<any>): CompNode {
    inputs.reverse()
    return createNode(cy, x, y, "input", "input", 0, 1, ()=>inputs.pop());
}

// Create an output node (has 1 input terminal)
export function createOutputNode(cy: Core, x: number, y: number): CompNode {
    return createNode(cy, x, y, "output", "output", 1, 0, (value: any)=>{console.log(value);});
}

// Create a plus node (2 inputs, 1 output)
export function createPlusNode(cy: Core, x: number, y: number): CompNode {
    return createNode(cy, x, y, "+", "compound", 2, 1, (a: any, b: any)=>a+b);
}

// Create a combine node (2 inputs, 1 output)
export function createCombineNode(cy: Core, x: number, y: number): CompNode {
    return createNode(cy, x, y, "combine", "compound", 2, 1, (a: any, b: any)=>[a, b]);
}

// Create a split node (1 input, 2 outputs)
export function createSplitNode(cy: Core, x: number, y: number): CompNode {
    return createNode(cy, x, y, "split", "compound", 1, 2, (a: any)=>a);
}

// Create a nop node (1 input, 1 output)
export function createNopNode(cy: Core, x: number, y: number): CompNode {
    return createNode(cy, x, y, "+", "compound", 1, 1, (a: any)=>a);
}