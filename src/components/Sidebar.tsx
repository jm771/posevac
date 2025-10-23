import { LevelContext } from "../editor_context";
import React, { useRef, useState } from "react";
import { ComponentBar } from "./ComponentBar";
import { DeleteArea } from "./DeleteArea";
import { CompNode } from "../nodes";
import { getRenderedPositionOfNode } from "../rendered_position";

export function LevelSidebar({ levelContext }: { levelContext: LevelContext }) {
  const level = levelContext.editorContext.level;
  const sideBarRef = useRef<HTMLBaseElement | null>(null);
  const [draggedNode, setDraggedNode] = useState<CompNode | null>(null);
  const [nodeIsOverBar, setNodeIsOverBar] = useState<boolean>(false);

  // Pretty sure this is just that the linter doesn't get this is a callback
  // eslint-disable-next-line react-hooks/refs
  levelContext.editorContext.cy.on("drag", "node", (evt) => {
    const node: CompNode | null = levelContext.editorContext.getCompNodeForNode(
      evt.target
    );

    if (node === null) return;

    setDraggedNode(node);
    if (!sideBarRef.current) return;
    const nodePos = getRenderedPositionOfNode(node.node);
    const sidebarBounds = sideBarRef.current!.getBoundingClientRect();
    setNodeIsOverBar(nodePos.x < sidebarBounds.right);
  });

  levelContext.editorContext.cy.on("free", "node", function (evt) {
    const context = levelContext.editorContext;
    const node: CompNode | null = context.getCompNodeForNode(evt.target);

    if (node?.deletable) {
      setNodeIsOverBar((isOver) => {
        if (isOver) {
          console.log("removing");
          context.removeNode(node.getNodeId());
        }

        return false;
      });
    }
  });

  return (
    <aside ref={sideBarRef} className="sidebar" id="sidebar">
      <div className="level-info">
        <h2 id="levelName">{level.name}</h2>
        <p id="levelDescription">{level.description}</p>
      </div>
      <h3>Components</h3>
      <ComponentBar levelContext={levelContext} />
      <DeleteArea draggedNode={draggedNode} nodeIsOverBar={nodeIsOverBar} />
    </aside>
  );
}
