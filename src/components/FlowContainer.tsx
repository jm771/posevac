import {
  addEdge,
  Background,
  Connection,
  Controls,
  Edge,
  Node,
  NodeTypes,
  OnConnect,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
  Viewport,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import React, { useCallback, useRef, useState } from "react";
import { Condition } from "../condition";
import { LevelContext } from "../editor_context";
import { ComponentType, ConstantNodeData, createNodeFromName } from "../nodes";
import { PanZoomState } from "../rendered_position";
import { CompoundNode, ConstantNode, FlowNodeData } from "./FlowNodes";

const nodeTypes: NodeTypes = {
  compound: CompoundNode,
  constant: ConstantNode,
};

let edgeIdCounter = 0;

export function FlowContainer({
  levelContext,
  children,
  onViewportChange,
}: {
  levelContext: LevelContext | null;
  children: React.JSX.Element;
  onViewportChange?: (panZoom: PanZoomState) => void;
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<FlowNodeData>>(
    []
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const reactFlowInstance = useReactFlow();
  const [updateCounter, setUpdateCounter] = useState(0);

  // Function to sync nodes and edges from backend
  const syncFromBackend = useCallback(() => {
    if (!levelContext) return;

    const flowNodes: Node<FlowNodeData>[] = [];

    levelContext.editorContext.allNodes.forEach((compNode) => {
      const cyNode = compNode.node;
      const pos = cyNode.position();

      // Don't think this is actually true
      const data: ConstantNodeData = cyNode.data();

      const nodeType = data.type === "constant" ? "constant" : "compound";

      flowNodes.push({
        id: cyNode.id(),
        type: nodeType,
        position: { x: pos.x, y: pos.y },
        data: {
          label: data.label,
          style: data.style,
          inputCount: compNode.inputTerminals.length,
          outputCount: compNode.outputTerminals.length,
          constantValue: data.constantValue,
          constantRepeat: data.constantRepeat,
        },
      });
    });

    setNodes(flowNodes);

    // Sync edges
    const cy = levelContext.editorContext.cy;
    const flowEdges: Edge[] = cy.edges().map((edge) => ({
      id: edge.id(),
      source: edge.source().id(),
      target: edge.target().id(),
      type: "straight",
      sourceHandle: findHandleId(edge.source().id(), "output"),
      targetHandle: findHandleId(edge.target().id(), "input"),
      data: { condition: edge.data("condition") },
    }));

    setEdges(flowEdges);
  }, [levelContext, setNodes, setEdges]);

  // Sync nodes from backend to React Flow
  React.useEffect(() => {
    syncFromBackend();
  }, [levelContext, updateCounter, syncFromBackend]);

  function findHandleId(terminalId: string, type: "input" | "output"): string {
    if (!levelContext) return `${type}-0`;

    // Terminal IDs are like "node-0-output0" or "node-0-input0"
    // Extract the index from the terminal ID
    const match = terminalId.match(new RegExp(`${type}(\\d+)$`));
    if (match) {
      return `${type}-${match[1]}`;
    }
    return `${type}-0`;
  }

  // Handle new connections between nodes
  const onConnect: OnConnect = useCallback(
    (connection: Connection) => {
      if (!levelContext || !connection.source || !connection.target) return;

      const cy = levelContext.editorContext.cy;

      // Extract handle indices from the connection
      const sourceHandleIdx =
        connection.sourceHandle?.replace("output-", "") || "0";
      const targetHandleIdx =
        connection.targetHandle?.replace("input-", "") || "0";

      // Find the actual terminal IDs in the Cytoscape graph
      const sourceTerminalId = `${connection.source}-output${sourceHandleIdx}`;
      const targetTerminalId = `${connection.target}-input${targetHandleIdx}`;

      // Check if edge already exists
      const existingEdge = cy.edges(
        `[source="${sourceTerminalId}"][target="${targetTerminalId}"]`
      );

      if (existingEdge.length > 0) {
        // Delete existing edge
        existingEdge.remove();
        setEdges((eds) =>
          eds.filter(
            (e) =>
              !(
                e.source === connection.source &&
                e.target === connection.target &&
                e.sourceHandle === connection.sourceHandle &&
                e.targetHandle === connection.targetHandle
              )
          )
        );
      } else {
        // Create new edge in Cytoscape
        const newEdge = cy.add({
          group: "edges",
          data: {
            id: `edge-${edgeIdCounter++}`,
            source: sourceTerminalId,
            target: targetTerminalId,
            condition: new Condition([]),
          },
        });

        // Add to React Flow
        setEdges((eds) =>
          addEdge(
            {
              ...connection,
              type: "straight",
              id: newEdge.id(),
              data: { condition: new Condition([]) },
            },
            eds
          )
        );
      }
    },
    [levelContext, setEdges]
  );

  // Update node positions in the backend when dragged
  const onNodeDragStop = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (!levelContext) return;

      const compNode = levelContext.editorContext.allNodes.find(
        (n) => n.getNodeId() === node.id
      );

      if (compNode) {
        compNode.node.position({ x: node.position.x, y: node.position.y });
      }
    },
    [levelContext]
  );

  // Handle viewport changes
  const handleViewportChange = useCallback(
    (viewport: Viewport) => {
      if (onViewportChange) {
        onViewportChange(
          new PanZoomState({ x: viewport.x, y: viewport.y }, viewport.zoom)
        );
      }
    },
    [onViewportChange]
  );

  // Handle drag and drop from ComponentBar
  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();

      if (!levelContext || !reactFlowWrapper.current) return;

      const componentType = e.dataTransfer.getData(
        "component-type"
      ) as ComponentType;
      if (!componentType) return;

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = reactFlowInstance.screenToFlowPosition({
        x: e.clientX - reactFlowBounds.left,
        y: e.clientY - reactFlowBounds.top,
      });

      // Create node in the backend
      const newNode = createNodeFromName(
        levelContext.editorContext,
        componentType,
        position.x,
        position.y
      );

      levelContext.editorContext.allNodes.push(newNode);

      // Trigger a re-sync
      setUpdateCounter((c) => c + 1);
    },
    [levelContext, reactFlowInstance, setUpdateCounter]
  );

  return (
    <div
      ref={reactFlowWrapper}
      className="flow-container-wrapper"
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        onMove={(_event, viewport) => handleViewportChange(viewport)}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.5}
        maxZoom={2}
      >
        <Background />
        <Controls />
        {children}
      </ReactFlow>
    </div>
  );
}

export function FlowContainerWrapper(props: {
  levelContext: LevelContext | null;
  children: React.JSX.Element;
  onViewportChange?: (panZoom: PanZoomState) => void;
}) {
  return (
    <ReactFlowProvider>
      <FlowContainer {...props} />
    </ReactFlowProvider>
  );
}
