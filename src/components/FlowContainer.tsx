import Flow, {
  addEdge,
  Background,
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
import React, { useCallback, useRef } from "react";
import { Condition } from "../condition";
import { LevelContext } from "../editor_context";
import { RegularComponentType } from "../node_definitions";
import { Connection, TerminalType } from "../pos_flow";
import { PanZoomState } from "../rendered_position";
import { NotNull } from "../util";
import {
  CompoundNode,
  ConstantNode,
  FlowNodeData,
  getFlowNodeDataFromDefintion,
} from "./FlowNodes";

function ConvertConnection(connection: Flow.Connection): Connection {
  const sourceHandleIdx = parseInt(
    NotNull(connection.sourceHandle).replace("output-", "")
  );
  const targetHandleIdx = parseInt(
    NotNull(connection.targetHandle?.replace("input-", ""))
  );

  return {
    source: {
      type: TerminalType.Output,
      nodeId: NotNull(connection.source),
      terminalIndex: sourceHandleIdx,
    },
    dest: {
      type: TerminalType.Input,
      nodeId: NotNull(connection.target),
      terminalIndex: targetHandleIdx,
    },
    condition: new Condition([]),
  };
}

const nodeTypes: NodeTypes = {
  compound: CompoundNode,
  constant: ConstantNode,
};

function edgeMatches(e1: Flow.Edge, e2: Flow.Connection): boolean {
  return (
    e1.source === e2.source &&
    e1.sourceHandle === e2.sourceHandle &&
    e1.target === e2.target &&
    e1.targetHandle === e2.targetHandle
  );
}

export function FlowContainer({
  levelContext,
  children,
  onViewportChange,
}: {
  levelContext: LevelContext;
  children: React.JSX.Element;
  onViewportChange?: (panZoom: PanZoomState) => void;
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<FlowNodeData>>(
    []
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const reactFlowInstance = useReactFlow();
  // const [updateCounter, setUpdateCounter] = useState(0);

  const posFlow = levelContext.editorContext.posFlow;

  // Function to sync nodes and edges from backend
  // const syncFromBackend = useCallback(() => {
  //   if (!levelContext) return;

  //   const flowNodes: Node<FlowNodeData>[] = [];

  //   levelContext.editorContext.posFlow.nodes.forEach((compNode) => {
  // const cyNode = compNode.node;
  // const pos = cyNode.position();
  // // Don't think this is actually true
  // const data: ConstantNodeData = cyNode.data();
  //data.type === "constant" ? "constant" : "compound";
  // flowNodes.push({
  //   id: compNode.id,
  //   type: compNode.definition.style.style,
  //   position: { x: pos.x, y: pos.y },
  //   data: {
  //     label: data.label,
  //     style: data.style,
  //     inputCount: compNode.inputTerminals.length,
  //     outputCount: compNode.outputTerminals.length,
  //     constantValue: data.constantValue,
  //     constantRepeat: data.constantRepeat,
  //   },
  // });
  //   });

  //   setNodes(flowNodes);

  //   // Sync edges
  //   const cy = levelContext.editorContext.cy;
  //   const flowEdges: Edge[] = cy.edges().map((edge) => ({
  //     id: edge.id(),
  //     source: edge.source().id(),
  //     target: edge.target().id(),
  //     type: "straight",
  //     sourceHandle: findHandleId(edge.source().id(), "output"),
  //     targetHandle: findHandleId(edge.target().id(), "input"),
  //     data: { condition: edge.data("condition") },
  //   }));

  //   setEdges(flowEdges);
  // }, [levelContext, setNodes, setEdges]);

  // Sync nodes from backend to React Flow
  // React.useEffect(() => {
  //   syncFromBackend();
  // }, [levelContext, updateCounter, syncFromBackend]);

  // function findHandleId(terminalId: string, type: "input" | "output"): string {
  //   if (!levelContext) return `${type}-0`;

  //   // Terminal IDs are like "node-0-output0" or "node-0-input0"
  //   // Extract the index from the terminal ID
  //   const match = terminalId.match(new RegExp(`${type}(\\d+)$`));
  //   if (match) {
  //     return `${type}-${match[1]}`;
  //   }
  //   return `${type}-0`;
  // }

  // Handle new connections between nodes
  const onConnect: OnConnect = useCallback(
    (flowCon: Flow.Connection) => {
      if (!flowCon.source || !flowCon.target) return;

      const connection = ConvertConnection(flowCon);

      if (posFlow.HasConnection(connection)) {
        posFlow.RemoveConnection(connection);
        setEdges((eds) => eds.filter((e) => !edgeMatches(e, flowCon)));
      } else {
        posFlow.AddConnection(connection);
        setEdges((eds) => addEdge(flowCon, eds));
      }
    },
    [posFlow, setEdges]
  );

  // Update node positions in the backend when dragged
  // const onNodeDragStop = useCallback(
  //   (_event: React.MouseEvent, node: Node) => {
  //     const compNode = levelContext.editorContext.allNodes.find(
  //       (n) => n.getNodeId() === node.id
  //     );

  //     if (compNode) {
  //       compNode.node.position({ x: node.position.x, y: node.position.y });
  //     }
  //   },
  //   [levelContext]
  // );

  // const onNodesChange = useCallback(
  //   (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
  //   []
  // );

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

      if (!reactFlowWrapper.current) return;

      const componentType = e.dataTransfer.getData(
        "component-type"
      ) as RegularComponentType;

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = reactFlowInstance.screenToFlowPosition({
        x: e.clientX - reactFlowBounds.left,
        y: e.clientY - reactFlowBounds.top,
      });

      const compNode = levelContext.editorContext.AddNode(componentType);

      setNodes((nds) => [
        ...nds,
        {
          id: compNode.id,
          type: compNode.definition.style.style,
          position: position,
          data: getFlowNodeDataFromDefintion(compNode.definition),
        },
      ]);
    },
    [levelContext, reactFlowInstance, setNodes]
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
        // onNodeDragStop={onNodeDragStop}
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
  levelContext: LevelContext;
  children: React.JSX.Element;
  onViewportChange?: (panZoom: PanZoomState) => void;
}) {
  return (
    <ReactFlowProvider>
      <FlowContainer {...props} />
    </ReactFlowProvider>
  );
}
