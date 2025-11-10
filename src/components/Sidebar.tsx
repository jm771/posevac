import { Node } from "@xyflow/react";
import React, { forwardRef, useContext, useEffect, useRef, useState } from "react";
import { GraphEditorContext } from "../contexts/graph_editor_context";
import { Level } from "../levels";
import { NodeDefinition } from "../node_definitions";
import { ComponentBar } from "./ComponentBar";
import { DeleteArea } from "./DeleteArea";

export const LevelSidebar = forwardRef<
  HTMLElement,
  {
    level: Level;
    draggedNode: Node<NodeDefinition> | null;
    dragPosition: { x: number; y: number } | null;
  }
>(({ level, draggedNode, dragPosition }, ref) => {
  const sideBarRef = useRef<HTMLElement | null>(null);
  const [isNodeOverBar, setIsNodeOverBar] = useState<boolean>(false);
  const prevDraggedNodeRef = useRef<Node<NodeDefinition> | null>(null);

  const graphEditor = useContext(GraphEditorContext);

  useEffect(() => {
    // Handle deletion when drag stops over sidebar
    if (prevDraggedNodeRef.current && !draggedNode && isNodeOverBar) {
      const node = prevDraggedNodeRef.current;
      if (node.deletable !== false) {
        graphEditor.RemoveNode(node);
      }
    }

    prevDraggedNodeRef.current = draggedNode;
  }, [draggedNode, isNodeOverBar, graphEditor]);

  useEffect(() => {
    if (!draggedNode || !dragPosition) {
      setIsNodeOverBar(false);
      return;
    }

    const sidebar = (ref as React.RefObject<HTMLElement>)?.current || sideBarRef.current;
    if (!sidebar) {
      setIsNodeOverBar(false);
      return;
    }

    const sidebarBounds = sidebar.getBoundingClientRect();
    const isOver = dragPosition.x < sidebarBounds.right;
    setIsNodeOverBar(isOver);
  }, [draggedNode, dragPosition, ref]);

  return (
    <aside
      ref={(node) => {
        sideBarRef.current = node;
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          (ref as React.MutableRefObject<HTMLElement | null>).current = node;
        }
      }}
      className="sidebar"
      id="sidebar"
    >
      <div className="level-info">
        <h2 id="levelName">{level.name}</h2>
        <p id="levelDescription">{level.description}</p>
      </div>
      <h3>Components</h3>
      <ComponentBar level={level} />
      <DeleteArea draggedNode={draggedNode} nodeIsOverBar={isNodeOverBar} />
    </aside>
  );
});

LevelSidebar.displayName = "LevelSidebar";
