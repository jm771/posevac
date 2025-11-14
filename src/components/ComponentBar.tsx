import { Node, ReactFlow, ReactFlowProvider } from "@xyflow/react";
import React, { useMemo, useRef } from "react";
import { Level } from "../levels";
import {
  GetNodeDefinition,
  NodeStyle,
  RegularComponentType,
} from "../node_definitions";
import { NotNull } from "../util";
import { CompoundNode, ConstantNode } from "./FlowNodes";

const nodeTypes = {
  compound: CompoundNode,
  constant: ConstantNode,
};

export function ComponentBar({ level }: { level: Level }) {
  return (
    <div className="components-list">
      {level.allowedNodes.map((type) => (
        <SidebarElement key={type} type={type} />
      ))}
    </div>
  );
}

export function SidebarElement({ type }: { type: RegularComponentType }) {
  const nodeDefinition = GetNodeDefinition(type);
  const divRef = useRef<HTMLDivElement | null>(null);

  const nodeType =
    nodeDefinition.style.style === NodeStyle.Constant ? "constant" : "compound";

  const previewNode: Node = useMemo(() => {
    return {
      id: `preview-${type}`,
      type: nodeType,
      position: { x: 0, y: 0 },
      data: nodeDefinition,
    };
  }, [nodeDefinition, nodeType, type]);

  return (
    <div
      ref={divRef}
      className="component-template"
      id={`preview-${type}`}
      draggable="true"
      onDragStart={(e: React.DragEvent<HTMLDivElement>) => {
        const bounds = NotNull(divRef.current).getBoundingClientRect();
        const offsetX = e.clientX - (bounds.left + bounds.right) / 2;
        const offsetY = e.clientY - (bounds.top + bounds.bottom) / 2;

        e.dataTransfer.setData("component-type", type);
        e.dataTransfer.setData("offsetX", String(offsetX));
        e.dataTransfer.setData("offsetY", String(offsetY));
        e.dataTransfer.effectAllowed = "copy";
      }}
    >
      <ReactFlowProvider>
        <ReactFlow
          nodes={[previewNode]}
          nodeTypes={nodeTypes}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          zoomOnScroll={false}
          panOnScroll={false}
          panOnDrag={false}
          zoomOnDoubleClick={false}
          preventScrolling={false}
          edgesFocusable={false}
          nodesFocusable={false}
          draggable={false}
          minZoom={1}
          maxZoom={1}
          proOptions={{ hideAttribution: true }}
          fitView
          fitViewOptions={{ padding: 0.2 }}
        ></ReactFlow>
      </ReactFlowProvider>
    </div>
  );
}
