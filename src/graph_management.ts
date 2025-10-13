import { EdgeSingular, NodeSingular } from "cytoscape";
import { editorContext } from "./global_state";

// Get output terminals from a node
function getOutputTerminals(node: NodeSingular): NodeSingular[] {
    return node.children().filter(child => child.data('terminalType') === 'output').toArray() as NodeSingular[];
}

// Get outgoing edges from output terminals
export function getOutgoingEdges(node: NodeSingular): EdgeSingular[] {
    if (!editorContext) {
        throw new Error('Editor context not initialized');
    }
    return getOutputTerminals(node).flatMap(terminal => editorContext!.cy.edges(`[source="${terminal.id()}"]`).toArray());
}