import { EventObject } from "cytoscape";
import React, { useEffect, useRef, useState } from "react";
import { LevelContext } from "../editor_context";
import { CompNode } from "../nodes";
import { getRenderedPositionOfNode } from "../rendered_position";
import { ComponentBar } from "./ComponentBar";
import { DeleteArea } from "./DeleteArea";

export function LevelSidebar({ levelContext }: { levelContext: LevelContext }) {
  const level = levelContext.editorContext.level;
  const sideBarRef = useRef<HTMLBaseElement | null>(null);
  const [draggedNode, setDraggedNode] = useState<CompNode | null>(null);
  const isNodeOverBarRef = useRef<boolean>(false);
  const [isNodeOverBar, setIsNodeOverBar] = useState<boolean>(false);

  useEffect(() => {
    function dragHandler(evt: EventObject) {
      const node: CompNode | null =
        levelContext.editorContext.tryGetCompNodeForNode(evt.target);

      if (node === null) return;

      setDraggedNode(node);
      if (!sideBarRef.current) return;
      const nodePos = getRenderedPositionOfNode(node.node);
      const sidebarBounds = sideBarRef.current!.getBoundingClientRect();
      isNodeOverBarRef.current = nodePos.x < sidebarBounds.right;
      setIsNodeOverBar(isNodeOverBarRef.current);
    }

    function freeHandler(evt: EventObject) {
      const context = levelContext.editorContext;
      const node: CompNode | null = context.tryGetCompNodeForNode(evt.target);

      if (node?.deletable && isNodeOverBarRef.current) {
        context.removeNode(node.getNodeId());
        isNodeOverBarRef.current = false;
        setIsNodeOverBar(false);
      }
    }

    levelContext.editorContext.cy.on("free", "node", freeHandler);
    levelContext.editorContext.cy.on("drag", "node", dragHandler);

    return () => {
      levelContext.editorContext.cy.off("free", "node", freeHandler);
      levelContext.editorContext.cy.off("drag", "node", dragHandler);
    };
  }, [levelContext]);

  return (
    <aside ref={sideBarRef} className="sidebar" id="sidebar">
      <div className="level-info">
        <h2 id="levelName">{level.name}</h2>
        <p id="levelDescription">{level.description}</p>
      </div>
      <h3>Components</h3>
      <ComponentBar levelContext={levelContext} />
      <DeleteArea draggedNode={draggedNode} nodeIsOverBar={isNodeOverBar} />
    </aside>
  );
}
