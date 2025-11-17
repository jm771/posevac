import Flow, {
  Background,
  Controls,
  NodeTypes,
  OnConnect,
  ReactFlow,
  useReactFlow,
  ViewportPortal,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import React, { useCallback, useContext, useRef } from "react";
import { FlowPropsContext } from "../contexts/flow_props_context";
import { GraphEditorContext } from "../contexts/graph_editor_context";
import { NodeCallbackContext } from "../contexts/node_callbacks_context";
import { RegularComponentType } from "../node_definitions";
import { AnimatedNodeEdge } from "./AnimatedNodeEdge";
import { CompoundNode, ConstantNode } from "./FlowNodes";

const nodeTypes: NodeTypes = {
  compound: CompoundNode,
  constant: ConstantNode,
};

export function FlowContainer({ children }: { children: React.JSX.Element }) {
  const flowProps = useContext(FlowPropsContext);
  const graphEditor = useContext(GraphEditorContext);
  const nodeCallbacks = useContext(NodeCallbackContext);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const reactFlowInstance = useReactFlow();

  const onConnect: OnConnect = useCallback(
    (flowCon: Flow.Connection) => {
      if (!flowCon.source || !flowCon.target) return;
      graphEditor.HandleConnectionAttempt(flowCon);
    },
    [graphEditor]
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

      const offsetX = parseFloat(e.dataTransfer.getData("offsetX"));
      const offsetY = parseFloat(e.dataTransfer.getData("offsetY"));

      const position = reactFlowInstance.screenToFlowPosition({
        x: e.clientX - offsetX,
        y: e.clientY - offsetY,
      });

      graphEditor.AddNode(componentType, position);
    },
    [graphEditor, reactFlowInstance]
  );

  return (
    <div
      ref={reactFlowWrapper}
      className="flow-container-wrapper"
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <ReactFlow
        edgeTypes={{ animated: AnimatedNodeEdge }}
        connectOnClick={true}
        // connectionLineType={ConnectionLineType.Straight}
        {...flowProps}
        onConnect={onConnect}
        // onMove={(_event, viewport) => handleViewportChange(viewport)}
        onNodeDrag={nodeCallbacks.OnNodeDrag}
        onNodeDragStop={nodeCallbacks.OnNodeDragEnd}
        nodeTypes={nodeTypes}
        autoPanOnNodeDrag={false}
        // fitView
        // minZoom={0.5}
        defaultViewport={{ x: 500, y: 100, zoom: 1 }}
        // maxZoom={2}
        nodeOrigin={[0.5, 0.5]}
      >
        <Background />
        <Controls />
        <ViewportPortal>{children}</ViewportPortal>
      </ReactFlow>
    </div>
  );
}
