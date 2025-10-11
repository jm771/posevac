import { cy } from './global_state'

let nodeIdCounter = 0;

// Create a start node (has 1 output terminal)
export function createStartNode(x: number, y: number): void {
    const nodeId = `node-${nodeIdCounter++}`;
    const outputId = `${nodeId}-out`;

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
    cy.add({
        group: 'nodes',
        data: {
            id: outputId,
            parent: nodeId,
            type: 'output-terminal',
            terminalType: 'output'
        },
        position: { x: x + 40, y: y }
    });

    cy.$(`#${outputId}`).ungrabify();
}

// Create a stop node (has 1 input terminal)
export function createStopNode(x: number, y: number): void {
    const nodeId = `node-${nodeIdCounter++}`;
    const inputId = `${nodeId}-in`;

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

    // Add input terminal (left point of diamond)
    cy.add({
        group: 'nodes',
        data: {
            id: inputId,
            parent: nodeId,
            type: 'input-terminal',
            terminalType: 'input'
        },
        position: { x: x - 40, y: y }
    });

    cy.$(`#${inputId}`).ungrabify();
}

// Create a plus node (2 inputs, 1 output)
export function createPlusNode(x: number, y: number): void {
    const nodeId = `node-${nodeIdCounter++}`;
    const input1Id = `${nodeId}-in1`;
    const input2Id = `${nodeId}-in2`;
    const outputId = `${nodeId}-out`;

    cy.add({
        group: 'nodes',
        data: {
            id: nodeId,
            label: '+',
            type: 'compound'
        },
        position: { x, y }
    });

    cy.add({
        group: 'nodes',
        data: {
            id: input1Id,
            parent: nodeId,
            type: 'input-terminal',
            terminalType: 'input'
        },
        position: { x: x - 50, y: y - 20 }
    });

    cy.add({
        group: 'nodes',
        data: {
            id: input2Id,
            parent: nodeId,
            type: 'input-terminal',
            terminalType: 'input'
        },
        position: { x: x - 50, y: y + 20 }
    });

    cy.add({
        group: 'nodes',
        data: {
            id: outputId,
            parent: nodeId,
            type: 'output-terminal',
            terminalType: 'output'
        },
        position: { x: x + 50, y: y }
    });

    cy.$(`#${input1Id}, #${input2Id}, #${outputId}`).ungrabify();
}

// Create a combine node (2 inputs, 1 output)
export function createCombineNode(x: number, y: number): void {
    const nodeId = `node-${nodeIdCounter++}`;
    const input1Id = `${nodeId}-in1`;
    const input2Id = `${nodeId}-in2`;
    const outputId = `${nodeId}-out`;

    cy.add({
        group: 'nodes',
        data: {
            id: nodeId,
            label: 'combine',
            type: 'compound'
        },
        position: { x, y }
    });

    cy.add({
        group: 'nodes',
        data: {
            id: input1Id,
            parent: nodeId,
            type: 'input-terminal',
            terminalType: 'input'
        },
        position: { x: x - 50, y: y - 20 }
    });

    cy.add({
        group: 'nodes',
        data: {
            id: input2Id,
            parent: nodeId,
            type: 'input-terminal',
            terminalType: 'input'
        },
        position: { x: x - 50, y: y + 20 }
    });

    cy.add({
        group: 'nodes',
        data: {
            id: outputId,
            parent: nodeId,
            type: 'output-terminal',
            terminalType: 'output'
        },
        position: { x: x + 50, y: y }
    });

    cy.$(`#${input1Id}, #${input2Id}, #${outputId}`).ungrabify();
}

// Create a split node (1 input, 2 outputs)
export function createSplitNode(x: number, y: number): void {
    const nodeId = `node-${nodeIdCounter++}`;
    const inputId = `${nodeId}-in`;
    const output1Id = `${nodeId}-out1`;
    const output2Id = `${nodeId}-out2`;

    cy.add({
        group: 'nodes',
        data: {
            id: nodeId,
            label: 'split',
            type: 'compound'
        },
        position: { x, y }
    });

    cy.add({
        group: 'nodes',
        data: {
            id: inputId,
            parent: nodeId,
            type: 'input-terminal',
            terminalType: 'input'
        },
        position: { x: x - 50, y: y }
    });

    cy.add({
        group: 'nodes',
        data: {
            id: output1Id,
            parent: nodeId,
            type: 'output-terminal',
            terminalType: 'output'
        },
        position: { x: x + 50, y: y - 20 }
    });

    cy.add({
        group: 'nodes',
        data: {
            id: output2Id,
            parent: nodeId,
            type: 'output-terminal',
            terminalType: 'output'
        },
        position: { x: x + 50, y: y + 20 }
    });

    cy.$(`#${inputId}, #${output1Id}, #${output2Id}`).ungrabify();
}

// Create a nop node (1 input, 1 output)
export function createNopNode(x: number, y: number): void {
    const nodeId = `node-${nodeIdCounter++}`;
    const inputId = `${nodeId}-in`;
    const outputId = `${nodeId}-out`;

    cy.add({
        group: 'nodes',
        data: {
            id: nodeId,
            label: 'nop',
            type: 'compound'
        },
        position: { x, y }
    });

    cy.add({
        group: 'nodes',
        data: {
            id: inputId,
            parent: nodeId,
            type: 'input-terminal',
            terminalType: 'input'
        },
        position: { x: x - 50, y: y }
    });

    cy.add({
        group: 'nodes',
        data: {
            id: outputId,
            parent: nodeId,
            type: 'output-terminal',
            terminalType: 'output'
        },
        position: { x: x + 50, y: y }
    });

    cy.$(`#${inputId}, #${outputId}`).ungrabify();
}