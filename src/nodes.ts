// import { cy } from './global_state'

import { Core, NodeSingular } from "cytoscape";
import { ProgramCounter } from "./program_counter";
import { editorContext } from "./global_state";

let nodeIdCounter = 0;

// Type definitions
export type ComponentType = 'input' | 'output' | 'plus' | 'combine' | 'split' | 'nop';

export class EvaluateOutput {
    pcsDestroyed : Array<ProgramCounter>
    pcsCreated : Array<ProgramCounter>

    constructor(pcsDestroyed : Array<ProgramCounter>, pcsCreated : Array<ProgramCounter>) {
        this.pcsCreated = pcsCreated;
        this.pcsDestroyed =pcsDestroyed;
    }
}

export function getTerminalProgramCounters(terminal: NodeSingular) : Map<string, ProgramCounter> {
    return terminal.data('program_counters')
}


function makeTerminals(cy: Core, nodeId: string, x: number, y: number, n: number, type: string): NodeSingular[] {
    if (n == 0)
    {
        // Warning - this is "leaked" - probably fine?
        makeTerminals(cy, nodeId, x, y, 1, "invisible");
        return []
    }

    const minY = -60;
    const maxY = 60;
    const terminals: NodeSingular[] = [];

    for (let i = 0; i < n; i++)
    {
        const terminalId = `${nodeId}-${type}${i}`;
        const yOffset = ((i + 1.0) * (maxY - minY) / (n + 1.0)) + minY;
        cy.add({
            group: 'nodes',
            data: {
                id: terminalId,
                parent: nodeId,
                type: `${type}-terminal`,
                terminalType: type,
                program_counters: new Map<string, ProgramCounter>()
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
    

    evaluate() : EvaluateOutput
    {
        for (const term of this.outputTerminals) {
            if (getTerminalProgramCounters(term).size != 0) {
                return new EvaluateOutput([], []);
            }
        }

        for (const term of this.inputTerminals) {
            if (getTerminalProgramCounters(term).size > 1) {
                throw Error("More than one program counter at input");
            }
            if (getTerminalProgramCounters(term).size == 0) {
                return new EvaluateOutput([], []);
            }
        }

        // TODO need to do contents better
        const result = (<any>this.func)(...(this.inputTerminals.map(t => getTerminalProgramCounters(t).values().next().value?.contents)));
        let newPcs : Array<ProgramCounter> = []

        if(result != undefined)
        {
            let resultArray;

            if (this.outputTerminals.length == 1)
            {
                resultArray = [result];
            } else
            {
                resultArray = result as Array<any>;
            } 
            if (this.outputTerminals.length != resultArray.length) {
                throw Error("N out terminals didn't match result length");
            }

            for (let i = 0; i < resultArray.length; i++)
            {
                for (let edge of editorContext!.cy.edges(`[source="${this.outputTerminals[i].id()}"]`).toArray())
                {
                    let newPc = new ProgramCounter(this.outputTerminals[i], edge, resultArray[i]);
                    getTerminalProgramCounters(this.outputTerminals[i]).set(newPc.id, newPc);
                    newPcs.push(newPc);
                }
            }
        }

        let rmedPcs : Array<ProgramCounter> = [];
        this.inputTerminals.forEach(term => {
            rmedPcs.push(getTerminalProgramCounters(term).values().next().value as ProgramCounter);
            getTerminalProgramCounters(term).clear();
        });

        return new EvaluateOutput(
            rmedPcs,
            newPcs,
        )
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
    return createNode(cy, x, y, "input", "input", 0, 1, ()=> inputs.pop());
}

// Create an output node (has 1 input terminal)
export function createOutputNode(cy: Core, x: number, y: number, expectedOutputs: Array<any>): CompNode {
    expectedOutputs.reverse();
    return createNode(cy, x, y, "output", "output", 1, 0, (value: any)=>{let expected = expectedOutputs.pop; console.log("Got output, ", expected, value);});
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