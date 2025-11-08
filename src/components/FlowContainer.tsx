import Flow, {
  Background,
  Controls,
  NodeTypes,
  OnConnect,
  ReactFlow,
  useReactFlow,
  Viewport,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import React, { useCallback, useContext, useRef } from "react";
import { FlowPropsContext } from "../contexts/flow_props_context";
import { GraphEditorContext } from "../contexts/graph_editor_context";
import { RegularComponentType } from "../node_definitions";
import { PanZoomState } from "../rendered_position";
import { CompoundNode, ConstantNode } from "./FlowNodes";

const nodeTypes: NodeTypes = {
  compound: CompoundNode,
  constant: ConstantNode,
};

export function FlowContainer({
  // levelContext,
  children,
  onViewportChange,
}: {
  // levelContext: LevelContext;
  children: React.JSX.Element;
  onViewportChange?: (panZoom: PanZoomState) => void;
}) {
  const flowProps = useContext(FlowPropsContext);
  const graphEditor = useContext(GraphEditorContext);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const reactFlowInstance = useReactFlow();

  const onConnect: OnConnect = useCallback(
    (flowCon: Flow.Connection) => {
      if (!flowCon.source || !flowCon.target) return;
      graphEditor.HandleConnectionAttempt(flowCon);
    },
    [graphEditor]
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
        {...flowProps}
        onConnect={onConnect}
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

// export function FlowContainerWrapper(props: {
//   levelContext: LevelContext;
//   children: React.JSX.Element;
//   onViewportChange?: (panZoom: PanZoomState) => void;
// }) {
//   return (
//     <ReactFlowProvider>
//       <FlowContainer {...props} />
//     </ReactFlowProvider>
//   );
// }
