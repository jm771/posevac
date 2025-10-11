import { EdgeSingular, NodeSingular } from "cytoscape";

// Get output terminals from a node
export function getOutputTerminals(node: NodeSingular): NodeSingular[] {
    // For start nodes, find the output terminal child
    const nodeType = node.data('type');
    if (nodeType === 'start' || nodeType === 'compound') {
        const children = node.children();
        return children.filter(child => child.data('terminalType') === 'output').toArray() as NodeSingular[];
    }

    return [];
}

// Get outgoing edges from output terminals
export function getOutgoingEdges(node: NodeSingular): EdgeSingular[] {
    const outputTerminals = getOutputTerminals(node);
    let edges: EdgeSingular[] = [];

    outputTerminals.forEach(terminal => {
        const terminalEdges = cy.edges(`[source="${terminal.id()}"]`);
        edges = edges.concat(terminalEdges.toArray() as EdgeSingular[]);
    });

    return edges;
}