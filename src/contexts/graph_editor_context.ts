import Flow, { addEdge, Node, XYPosition } from "@xyflow/react";
import React, { createContext, Dispatch, SetStateAction } from "react";
import {
  GetNodeDefinition,
  NodeDefinition,
  RegularComponentType,
} from "../node_definitions";
import { Connection } from "../pos_flow";

function edgeMatches(e1: Flow.Edge, e2: Flow.Connection): boolean {
  return (
    e1.source === e2.source &&
    e1.sourceHandle === e2.sourceHandle &&
    e1.target === e2.target &&
    e1.targetHandle === e2.targetHandle
  );
}

export class GraphEditor {
  nodeIdxRef: React.RefObject<number>;
  setNodes: Dispatch<SetStateAction<Node<NodeDefinition>[]>>;
  setEdges: Dispatch<SetStateAction<Flow.Edge<Connection>[]>>;

  constructor(
    nodeIdxRef: React.RefObject<number>,
    setNodes: Dispatch<SetStateAction<Node<NodeDefinition>[]>>,
    setEdges: Dispatch<SetStateAction<Flow.Edge<Connection>[]>>
  ) {
    this.nodeIdxRef = nodeIdxRef;
    this.setNodes = setNodes;
    this.setEdges = setEdges;
  }

  AddConnection(flowCon: Flow.Connection) {
    this.setEdges((eds) => addEdge(flowCon, eds));
  }

  RemoveConnection(flowCon: Flow.Connection) {
    this.setEdges((eds) => eds.filter((e) => !edgeMatches(e, flowCon)));
  }

  HandleConnectionAttempt(flowCon: Flow.Connection) {
    this.setEdges((eds) => {
      let removed = false;
      const ret = eds.filter((e) => {
        removed ||= edgeMatches(e, flowCon);
        return !edgeMatches(e, flowCon);
      });

      if (!removed) {
        ret.push({
          id: `edge-${this.nodeIdxRef.current++}`,
          ...flowCon,
          data: { val: "TODO" },
        });
      }
    });
  }

  AddNode(componentType: RegularComponentType, position: XYPosition) {
    const defn = GetNodeDefinition(componentType);

    this.setNodes((nds) => [
      ...nds,
      {
        id: `node-${this.nodeIdxRef.current++}`,
        type: defn.style.style,
        position: position,
        data: defn,
      },
    ]);
  }

  RemoveNode(node: Flow.Node<NodeDefinition>) {
    this.setNodes((nds) => nds.filter((n) => n.id != node.id));
  }
}

export const GraphEditorContext = createContext<GraphEditor>(
  null as unknown as GraphEditor
);
