// Graph Serialization - Save and load graph structures to/from JSON
import { NodeSingular } from "cytoscape";
import { Condition } from "./condition";
import { EdgeData } from "./edges";
import { GraphEditorContext } from "./editor_context";
import {
  CompNode,
  ComponentType,
  createConstantNode,
  createNodeFromName,
} from "./nodes";
import { Assert } from "./util";

const SERIALIZATION_VERSION = "1.0.1";

export interface SerializedGraph {
  version: string;
  levelId: string;
  timestamp: string;
  nodes: SerializedNode[];
  edges: SerializedEdge[];
}

export interface SerializedNode {
  id: string;
  type: ComponentType;
  position: { x: number; y: number };
  constantValue?: unknown;
  constantRepeat?: boolean;
}

export interface SerializedEdge {
  sourceNodeId: string;
  sourceTerminalIndex: number;
  targetNodeId: string;
  targetTerminalIndex: number;
  condition: number[];
}
export function exportGraph(context: GraphEditorContext): SerializedGraph {
  const cy = context.cy;

  // Get all user-created nodes (exclude input/output nodes and terminals)
  const userNodes = context.allNodes
    .map((cn) => cn.node)
    .filter((node) => {
      const nodeType: ComponentType = node.data("type");
      return nodeType !== "input" && nodeType !== "output";
    });

  const serializedNodes: SerializedNode[] = userNodes.map((node) => {
    const nodeSingular = node as NodeSingular;
    const position = nodeSingular.position();
    const nodeType = nodeSingular.data("type");

    const serialized: SerializedNode = {
      id: nodeSingular.id(),
      type: nodeType,
      position: { x: position.x, y: position.y },
    };

    // Add constant-specific fields
    if (nodeType === "constant") {
      serialized.constantValue = nodeSingular.data("constantValue");
      serialized.constantRepeat = nodeSingular.data("constantRepeat");
    }

    return serialized;
  });

  // Get all edges between user-created nodes (exclude edges to/from input/output)
  const userEdges = cy.edges();

  // Serialize edges - track which terminal on which node
  const serializedEdges: SerializedEdge[] = userEdges.map((edge) => {
    const sourceTerminalId = edge.data("source");
    const targetTerminalId = edge.data("target");

    const sourceTerminal = cy.$(`#${sourceTerminalId}`) as NodeSingular;
    const targetTerminal = cy.$(`#${targetTerminalId}`) as NodeSingular;

    const sourceParent = sourceTerminal.parent() as NodeSingular;
    const targetParent = targetTerminal.parent() as NodeSingular;

    // Parse terminal index from terminal ID
    // Terminal IDs are like "node-0-output0" or "node-1-input1"
    const sourceTerminalType = sourceTerminal.data("terminalType"); // "input" or "output"
    const targetTerminalType = targetTerminal.data("terminalType");

    // Extract the terminal index from the ID
    const sourceMatch = sourceTerminalId.match(
      new RegExp(`${sourceTerminalType}(\\d+)$`)
    );
    const targetMatch = targetTerminalId.match(
      new RegExp(`${targetTerminalType}(\\d+)$`)
    );

    const sourceIndex = sourceMatch ? parseInt(sourceMatch[1]) : 0;
    const targetIndex = targetMatch ? parseInt(targetMatch[1]) : 0;

    const serialized: SerializedEdge = {
      sourceNodeId: sourceParent.id(),
      sourceTerminalIndex: sourceIndex,
      targetNodeId: targetParent.id(),
      targetTerminalIndex: targetIndex,
      condition: (edge.data("condition") as Condition).matchers,
    };

    return serialized;
  });

  return {
    version: SERIALIZATION_VERSION,
    levelId: context.level.id,
    timestamp: new Date().toISOString(),
    nodes: serializedNodes,
    edges: serializedEdges,
  };
}

export function importGraph(
  context: GraphEditorContext,
  serializedGraph: SerializedGraph
): void {
  const cy = context.cy;

  Assert(
    serializedGraph.version === SERIALIZATION_VERSION,
    "Wrong serialization version"
  );

  cy.edges().remove();

  if (serializedGraph.levelId !== context.level.id) {
    throw new Error(
      `Graph is for level "${serializedGraph.levelId}" but current level is "${context.level.id}"`
    );
  }

  const nodeIdMap = new Map<string, CompNode>();
  context.inputNodes.forEach((n) => nodeIdMap.set(n.getNodeId(), n));
  context.outputNodes.forEach((n) => nodeIdMap.set(n.getNodeId(), n));

  for (const serializedNode of serializedGraph.nodes) {
    let newNode: CompNode;

    switch (serializedNode.type) {
      case "constant":
        newNode = createConstantNode(
          context,
          serializedNode.position.x,
          serializedNode.position.y,
          serializedNode.constantValue ?? 0,
          serializedNode.constantRepeat ?? true
        );
        break;
      default:
        newNode = createNodeFromName(
          context,
          serializedNode.type,
          serializedNode.position.x,
          serializedNode.position.y
        );
        break;
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
    const sourceTerminal =
      sourceCompNode.outputTerminals[serializedEdge.sourceTerminalIndex];
    const targetTerminal =
      targetCompNode.inputTerminals[serializedEdge.targetTerminalIndex];

    if (!sourceTerminal) {
      console.warn(
        `Source terminal ${serializedEdge.sourceTerminalIndex} not found on node ${serializedEdge.sourceNodeId}`
      );
      continue;
    }

    if (!targetTerminal) {
      console.warn(
        `Target terminal ${serializedEdge.targetTerminalIndex} not found on node ${serializedEdge.targetNodeId}`
      );
      continue;
    }

    // Create edge between the terminals
    const edgeData: EdgeData = {
      source: sourceTerminal.id(),
      target: targetTerminal.id(),
      condition: new Condition([]),
    };

    // Restore condition if it exists
    if (serializedEdge.condition) {
      edgeData.condition = new Condition(serializedEdge.condition);
    }

    cy.add({
      group: "edges",
      data: edgeData,
    });
  }

  console.log(
    `Imported ${serializedGraph.nodes.length} nodes and ${serializedGraph.edges.length} edges`
  );
}

export function downloadGraphAsJSON(
  context: GraphEditorContext,
  filename?: string
): void {
  const serialized = exportGraph(context);
  const json = JSON.stringify(serialized, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename || `graph-${context.level.id}-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  console.log("Graph downloaded as JSON");
}

/**
 * Load graph from JSON file
 */
export function loadGraphFromFile(
  context: GraphEditorContext,
  file: File
): Promise<void> {
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
      reject(new Error("Failed to read file"));
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
export function importGraphFromJSON(
  context: GraphEditorContext,
  json: string
): void {
  const serialized = JSON.parse(json) as SerializedGraph;
  importGraph(context, serialized);
}
