import { Node } from "@xyflow/react";
import { EventObject } from "cytoscape";
import React, { useContext, useEffect, useRef, useState } from "react";
import { GraphEditorContext } from "../contexts/graph_editor_context";
import { Level } from "../levels";
import { NodeDefinition } from "../node_definitions";
import { getRenderedPositionOfNode } from "../rendered_position";
import { ComponentBar } from "./ComponentBar";
import { DeleteArea } from "./DeleteArea";

export function LevelSidebar({ level }: { level: Level }) {
  const sideBarRef = useRef<HTMLBaseElement | null>(null);
  const [draggedNode, setDraggedNode] = useState<Node<NodeDefinition> | null>(
    null
  );
  const isNodeOverBarRef = useRef<boolean>(false);
  const [isNodeOverBar, setIsNodeOverBar] = useState<boolean>(false);

  const graphEditor = useContext(GraphEditorContext);

  // Need to work out how to hook this up to flow

  useEffect(() => {
    function dragHandler(evt: EventObject) {
      const node: Node<NodeDefinition> | null = evt.target;

      if (node === null) return;

      setDraggedNode(node);
      if (!sideBarRef.current) return;
      const nodePos = getRenderedPositionOfNode(node.node);
      const sidebarBounds = sideBarRef.current!.getBoundingClientRect();
      isNodeOverBarRef.current = nodePos.x < sidebarBounds.right;
      setIsNodeOverBar(isNodeOverBarRef.current);
    }

    function freeHandler(evt: EventObject) {
      const node: Node<NodeDefinition> | null = evt.target;

      if (node?.deletable && isNodeOverBarRef.current) {
        graphEditor.RemoveNode(node);
        isNodeOverBarRef.current = false;
        setIsNodeOverBar(false);
      }
    }
  }, []);

  return (
    <aside ref={sideBarRef} className="sidebar" id="sidebar">
      <div className="level-info">
        <h2 id="levelName">{level.name}</h2>
        <p id="levelDescription">{level.description}</p>
      </div>
      <h3>Components</h3>
      <ComponentBar level={level} />
      <DeleteArea draggedNode={draggedNode} nodeIsOverBar={isNodeOverBar} />
    </aside>
  );
}
