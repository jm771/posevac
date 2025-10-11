import { cy } from './global_state'

let nodeIdCounter = 0;

function makeTerminals(nodeId: string, x: number, y: number, n: number, type: string): void {
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
                terminalType: type
            },
            position: { x: x, y: y + yOffset }
        });

        cy.$(`#${terminalId}`).ungrabify();
    }
}

function makeInputTerminals(nodeId: string, x: number, y: number, n: number): void {
    makeTerminals(nodeId, x-50, y, n, "input")
}

function makeOutputTerminals(nodeId: string, x: number, y: number, n: number): void {
    makeTerminals(nodeId, x+50, y, n, "output")
}

// Create a start node (has 1 output terminal)
export function createStartNode(x: number, y: number): void {
    const nodeId = `node-${nodeIdCounter++}`;

    // Add start node
    cy.add({
        group: 'nodes',
        data: {
            id: nodeId,
            label: 'start',
            type: 'start'
        },
        position: { x, y }
    });

    // Add output terminal (right point of diamond)
    makeOutputTerminals(nodeId, x, y, 1);
}

// Create a stop node (has 1 input terminal)
export function createStopNode(x: number, y: number): void {
    const nodeId = `node-${nodeIdCounter++}`;

    // Add stop node
    cy.add({
        group: 'nodes',
        data: {
            id: nodeId,
            label: 'stop',
            type: 'stop'
        },
        position: { x, y }
    });

    makeInputTerminals(nodeId, x, y, 1);
}

// Create a plus node (2 inputs, 1 output)
export function createPlusNode(x: number, y: number): void {
    const nodeId = `node-${nodeIdCounter++}`;

    cy.add({
        group: 'nodes',
        data: {
            id: nodeId,
            label: '+',
            type: 'compound'
        },
        position: { x, y }
    });

    makeInputTerminals(nodeId, x, y, 2);
    makeOutputTerminals(nodeId, x, y, 1);
}

// Create a combine node (2 inputs, 1 output)
export function createCombineNode(x: number, y: number): void {
    const nodeId = `node-${nodeIdCounter++}`;

    cy.add({
        group: 'nodes',
        data: {
            id: nodeId,
            label: 'combine',
            type: 'compound'
        },
        position: { x, y }
    });

    makeInputTerminals(nodeId, x, y, 2);
    makeOutputTerminals(nodeId, x, y, 1);
}

// Create a split node (1 input, 2 outputs)
export function createSplitNode(x: number, y: number): void {
    const nodeId = `node-${nodeIdCounter++}`;

    cy.add({
        group: 'nodes',
        data: {
            id: nodeId,
            label: 'split',
            type: 'compound'
        },
        position: { x, y }
    });

    makeInputTerminals(nodeId, x, y, 1);
    makeOutputTerminals(nodeId, x, y, 2);
}

// Create a nop node (1 input, 1 output)
export function createNopNode(x: number, y: number): void {
    const nodeId = `node-${nodeIdCounter++}`;

    cy.add({
        group: 'nodes',
        data: {
            id: nodeId,
            label: 'nop',
            type: 'compound'
        },
        position: { x, y }
    });

    makeInputTerminals(nodeId, x, y, 1);
    makeOutputTerminals(nodeId, x, y, 1);
}