import { Node, OnNodeDrag } from "@xyflow/react";
import { createContext } from "react";
import { NodeDefinition } from "../node_definitions";

export class NodeCallbacks {
  OnNodeDragCallbacks: Set<OnNodeDrag<Node<NodeDefinition>>> = new Set();
  OnNodeDragEndCallbacks: Set<OnNodeDrag<Node<NodeDefinition>>> = new Set();

  OnNodeDrag: OnNodeDrag<Node<NodeDefinition>> = (...args) =>
    this.OnNodeDragCallbacks.forEach((fn) => fn(...args));

  OnNodeDragEnd: OnNodeDrag<Node<NodeDefinition>> = (...args) =>
    this.OnNodeDragEndCallbacks.forEach((fn) => fn(...args));
}

export const NodeCallbackContext = createContext<NodeCallbacks>(
  null as unknown as NodeCallbacks
);
