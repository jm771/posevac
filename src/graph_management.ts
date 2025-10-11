import { EdgeSingular, NodeSingular } from "cytoscape";
import { cy } from "./global_state";

// Get output terminals from a node
function getOutputTerminals(node: NodeSingular): NodeSingular[] {
    return node.children().filter(child => child.data('terminalType') === 'output').toArray() as NodeSingular[];
}

// Get outgoing edges from output terminals
export function getOutgoingEdges(node: NodeSingular): EdgeSingular[] {
    return getOutputTerminals(node).flatMap(terminal => cy.edges(`[source="${terminal.id()}"]`).toArray());
}