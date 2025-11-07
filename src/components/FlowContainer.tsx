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
import { convertConnection, LevelContext } from "../editor_context";
import { RegularComponentType } from "../node_definitions";
import { PanZoomState } from "../rendered_position";
import { CompoundNode, ConstantNode, FlowNodeData } from "./FlowNodes";

const nodeTypes: NodeTypes = {
  compound: CompoundNode,
  constant: ConstantNode,
};

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

  const onConnect: OnConnect = useCallback(
    (flowCon: Flow.Connection) => {
      const posFlow = levelContext.editorContext.posFlow;
      if (!flowCon.source || !flowCon.target) return;

      const connection = convertConnection(flowCon);

      if (posFlow.HasConnection(connection)) {
        levelContext.editorContext.RemoveConnection(flowCon);
      } else {
        // TODO
        posFlow.AddConnection(connection);
        setEdges((eds) => addEdge(flowCon, eds));
      }
    },
    [levelContext, setEdges]
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

      levelContext.editorContext.AddNode(componentType, position);
    },
    [levelContext, reactFlowInstance]
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
