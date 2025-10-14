// Graph Serialization - Save and load graph structures to/from JSON
import { NodeSingular } from 'cytoscape';
import { GraphEditorContext } from './editor_context';
import { createPlusNode, createMultiplyNode, createCombineNode, createSplitNode, createNopNode, createConstantNode, CompNode } from './nodes';
import { createConstantControls, removeConstantControls, initializeConstantControls } from './constant_controls';

/**
 * Serializable graph structure - excludes animation state
 */
export interface SerializedGraph {
    version: string;
    levelId: string;
    timestamp: string;
    nodes: SerializedNode[];
    edges: SerializedEdge[];
}

export interface SerializedNode {
    id: string;
    type: 'plus' | 'multiply' | 'combine' | 'split' | 'nop' | 'constant';
    position: { x: number; y: number };
    label: string;
    constantValue?: any;
    constantRepeat?: boolean;
}

export interface SerializedEdge {
    sourceNodeId: string;
    sourceTerminalIndex: number;
    targetNodeId: string;
    targetTerminalIndex: number;
    condition?: string;
}

/**
 * Export the current graph to a JSON-serializable format
 * Excludes input/output nodes and animation state
 */
export function exportGraph(context: GraphEditorContext): SerializedGraph {
    const cy = context.cy;

    // Get all user-created nodes (exclude input/output nodes and terminals)
    const userNodes = cy.nodes().filter(node => {
        const nodeType = node.data('type');
        return (nodeType === 'compound' || nodeType === 'constant') && !node.data('parent');
    });

    // Serialize nodes
    const serializedNodes: SerializedNode[] = userNodes.map(node => {
        const nodeSingular = node as NodeSingular;
        const position = nodeSingular.position();
        const label = nodeSingular.data('label');
        const nodeType = nodeSingular.data('type');

        // Determine node type based on label or node type
        let type: SerializedNode['type'];
        if (nodeType === 'constant') {
            type = 'constant';
        } else {
            switch (label) {
                case '+': type = 'plus'; break;
                case '×': type = 'multiply'; break;
                case 'combine': type = 'combine'; break;
                case 'split': type = 'split'; break;
                default: type = 'nop'; break;
            }
        }

        const serialized: SerializedNode = {
            id: nodeSingular.id(),
            type: type,
            position: { x: position.x, y: position.y },
            label: label
        };

        // Add constant-specific fields
        if (type === 'constant') {
            serialized.constantValue = nodeSingular.data('constantValue');
            serialized.constantRepeat = nodeSingular.data('constantRepeat');
        }

        return serialized;
    });

    // Get all edges between user-created nodes (exclude edges to/from input/output)
    const userEdges = cy.edges()

    // Serialize edges - track which terminal on which node
    const serializedEdges: SerializedEdge[] = userEdges.map(edge => {
        const sourceTerminalId = edge.data('source');
        const targetTerminalId = edge.data('target');

        const sourceTerminal = cy.$(`#${sourceTerminalId}`) as NodeSingular;
        const targetTerminal = cy.$(`#${targetTerminalId}`) as NodeSingular;

        const sourceParent = sourceTerminal.parent() as NodeSingular;
        const targetParent = targetTerminal.parent() as NodeSingular;

        // Parse terminal index from terminal ID
        // Terminal IDs are like "node-0-output0" or "node-1-input1"
        const sourceTerminalType = sourceTerminal.data('terminalType'); // "input" or "output"
        const targetTerminalType = targetTerminal.data('terminalType');

        // Extract the terminal index from the ID
        const sourceMatch = sourceTerminalId.match(new RegExp(`${sourceTerminalType}(\\d+)$`));
        const targetMatch = targetTerminalId.match(new RegExp(`${targetTerminalType}(\\d+)$`));

        const sourceIndex = sourceMatch ? parseInt(sourceMatch[1]) : 0;
        const targetIndex = targetMatch ? parseInt(targetMatch[1]) : 0;

        const serialized: SerializedEdge = {
            sourceNodeId: sourceParent.id(),
            sourceTerminalIndex: sourceIndex,
            targetNodeId: targetParent.id(),
            targetTerminalIndex: targetIndex
        };

        // Add condition if it exists
        const condition = edge.data('condition');
        if (condition) {
            serialized.condition = condition;
        }

        return serialized;
    });

    return {
        version: '1.0.0',
        levelId: context.level.id,
        timestamp: new Date().toISOString(),
        nodes: serializedNodes,
        edges: serializedEdges
    };
}

/**
 * Import a graph from serialized format
 * Recreates user nodes and edges in the current context
 */
export function importGraph(context: GraphEditorContext, serializedGraph: SerializedGraph): void {
    const cy = context.cy;

    // Verify level compatibility
    if (serializedGraph.levelId !== context.level.id) {
        throw new Error(`Graph is for level "${serializedGraph.levelId}" but current level is "${context.level.id}"`);
    }

    // Clear existing user-created nodes and edges
    clearUserCreatedElements(context);

    // Create a mapping from old node IDs to new CompNode instances
    const nodeIdMap = new Map<string, CompNode>();
    context.inputNodes.forEach(n => nodeIdMap.set(n.getNodeId(), n));
    context.outputNodes.forEach(n => nodeIdMap.set(n.getNodeId(), n));

    
    // Recreate nodes
    for (const serializedNode of serializedGraph.nodes) {
        let newNode: CompNode;

        switch (serializedNode.type) {
            case 'plus':
                newNode = createPlusNode(context, serializedNode.position.x, serializedNode.position.y);
                break;
            case 'multiply':
                newNode = createMultiplyNode(context, serializedNode.position.x, serializedNode.position.y);
                break;
            case 'combine':
                newNode = createCombineNode(context, serializedNode.position.x, serializedNode.position.y);
                break;
            case 'split':
                newNode = createSplitNode(context, serializedNode.position.x, serializedNode.position.y);
                break;
            case 'nop':
                newNode = createNopNode(context, serializedNode.position.x, serializedNode.position.y);
                break;
            case 'constant':
                newNode = createConstantNode(
                    context,
                    serializedNode.position.x,
                    serializedNode.position.y,
                    serializedNode.constantValue ?? 0,
                    serializedNode.constantRepeat ?? true
                );
                // Create UI controls for the constant node
                createConstantControls(newNode.getNode());
                break;
            default:
                throw new Error(`Unknown node type: ${serializedNode.type}`);
        }

        context.allNodes.push(newNode);

        // Store mapping from old node ID to new CompNode
        nodeIdMap.set(serializedNode.id, newNode);
    }

    // Recreate edges using terminal mappings
    for (const serializedEdge of serializedGraph.edges) {
        // Find the new CompNodes from the mapping
        const sourceCompNode = nodeIdMap.get(serializedEdge.sourceNodeId);
        const targetCompNode = nodeIdMap.get(serializedEdge.targetNodeId);

        if (!sourceCompNode) {
            console.warn(`Source node not found: ${serializedEdge.sourceNodeId}`);
            continue;
        }

        if (!targetCompNode) {
            console.warn(`Target node not found: ${serializedEdge.targetNodeId}`);
            continue;
        }

        // Get the specific terminals using the indices
        const sourceTerminal = sourceCompNode.getOutputTerminals()[serializedEdge.sourceTerminalIndex];
        const targetTerminal = targetCompNode.getInputTerminals()[serializedEdge.targetTerminalIndex];

        if (!sourceTerminal) {
            console.warn(`Source terminal ${serializedEdge.sourceTerminalIndex} not found on node ${serializedEdge.sourceNodeId}`);
            continue;
        }

        if (!targetTerminal) {
            console.warn(`Target terminal ${serializedEdge.targetTerminalIndex} not found on node ${serializedEdge.targetNodeId}`);
            continue;
        }

        // Create edge between the terminals
        const edgeData: any = {
            source: sourceTerminal.id(),
            target: targetTerminal.id(),
            condition: ''
        };

        // Restore condition if it exists
        if (serializedEdge.condition) {
            edgeData.condition = serializedEdge.condition;
        }

        cy.add({
            group: 'edges',
            data: edgeData
        });
    }

    console.log(`Imported ${serializedGraph.nodes.length} nodes and ${serializedGraph.edges.length} edges`);

    // Refresh constant node labels if any were loaded
    initializeConstantControls();
}

/**
 * Clear all user-created nodes and edges (keep input/output nodes)
 */
export function clearUserCreatedElements(context: GraphEditorContext): void {
    context.animationState.resetState();
    const cy = context.cy;

    cy.remove(cy.edges());

    // Remove user-created nodes (and their edges automatically)
    const userNodes = cy.nodes().filter(node => {
        const nodeType = node.data('type');
        const parent = node.data('parent');
        // Keep input/output nodes and their terminals
        return (nodeType === 'compound' || nodeType === 'constant') && !parent;
    });

    // Clean up constant controls before removing nodes
    userNodes.forEach(node => {
        if (node.data('type') === 'constant') {
            removeConstantControls(node.id());
        }
    });

    cy.remove(userNodes);

    // Update allNodes array to only include input/output nodes
    context.allNodes = context.allNodes.filter(node => {
        const nodeType = node.getNode().data('type');
        return nodeType === 'input' || nodeType === 'output';
    });
}

/**
 * Download graph as JSON file
 */
export function downloadGraphAsJSON(context: GraphEditorContext, filename?: string): void {
    const serialized = exportGraph(context);
    const json = JSON.stringify(serialized, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `graph-${context.level.id}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log('Graph downloaded as JSON');
}

/**
 * Load graph from JSON file
 */
export function loadGraphFromFile(context: GraphEditorContext, file: File): Promise<void> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (event) => {
            try {
                const json = event.target?.result as string;
                const serialized = JSON.parse(json) as SerializedGraph;
                importGraph(context, serialized);
                resolve();
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = () => {
            reject(new Error('Failed to read file'));
        };

        reader.readAsText(file);
    });
}

/**
 * Export graph to JSON string
 */
export function exportGraphToJSON(context: GraphEditorContext): string {
    const serialized = exportGraph(context);
    return JSON.stringify(serialized, null, 2);
}

/**
 * Import graph from JSON string
 */
export function importGraphFromJSON(context: GraphEditorContext, json: string): void {
    const serialized = JSON.parse(json) as SerializedGraph;
    importGraph(context, serialized);
}
