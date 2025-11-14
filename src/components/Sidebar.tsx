import { Node, useReactFlow } from "@xyflow/react";
import React, {
  MouseEvent,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { GraphEditorContext } from "../contexts/graph_editor_context";
import { NodeCallbackContext } from "../contexts/node_callbacks_context";
import { Level } from "../levels";
import { NodeDefinition } from "../node_definitions";
import { ComponentBar } from "./ComponentBar";
import { DeleteArea } from "./DeleteArea";

export function LevelSidebar({ level }: { level: Level }) {
  const sideBarRef = useRef<HTMLElement | null>(null);
  const [canDelete, setCanDelete] = useState<boolean>(false);
  const callbacks = useContext(NodeCallbackContext);
  const graphContext = useContext(GraphEditorContext);
  const { flowToScreenPosition, getNodesBounds } = useReactFlow();

  const isDeletable = useCallback(
    (n: Node<NodeDefinition>) => {
      const rect = sideBarRef.current?.getBoundingClientRect();
      if (!rect) {
        return false;
      }

      const bounds = getNodesBounds([n]);
      const middle = bounds.x + bounds.width / 2;

      const screenMiddle = flowToScreenPosition({ x: middle, y: 0 }).x;

      return n.data.deletable && screenMiddle < rect.right;
    },
    [flowToScreenPosition, getNodesBounds]
  );

  useEffect(() => {
    function onDrag(
      _event: MouseEvent,
      node: Node<NodeDefinition>,
      _nodes: Node<NodeDefinition>[]
    ) {
      setCanDelete(isDeletable(node));
    }

    function onDragEnd(
      _event: MouseEvent,
      node: Node<NodeDefinition>,
      _nodes: Node<NodeDefinition>[]
    ) {
      if (isDeletable(node)) {
        graphContext.RemoveNode(node);
      }

      setCanDelete(false);
    }

    callbacks.OnNodeDragCallbacks.add(onDrag);
    callbacks.OnNodeDragEndCallbacks.add(onDragEnd);

    return () => {
      callbacks.OnNodeDragCallbacks.delete(onDrag);
      callbacks.OnNodeDragEndCallbacks.delete(onDragEnd);
    };
  }, [setCanDelete, callbacks]);

  return (
    <aside ref={sideBarRef} className="sidebar" id="sidebar">
      <div className="level-info">
        <h2 id="levelName">{level.name}</h2>
        <p id="levelDescription">{level.description}</p>
      </div>
      <h3>Components</h3>
      <ComponentBar level={level} />
      <DeleteArea deleteActive={canDelete} />
    </aside>
  );
}

LevelSidebar.displayName = "LevelSidebar";
