import Flow, { Node, XYPosition } from "@xyflow/react";
import React, { createContext, Dispatch, SetStateAction } from "react";
import { Condition } from "../condition";
import {
  ComponentType,
  GetNodeDefinition,
  NodeDefinition,
  NodeStyle,
} from "../node_definitions";
import { Connection, TerminalType } from "../pos_flow";
import { Assert, NotNull } from "../util";
import { makeDefaultSettings, NodeSetting } from "./node_settings_context";

function edgeMatches(e1: Flow.Edge, e2: Flow.Connection): boolean {
  return (
    e1.source === e2.source &&
    e1.sourceHandle === e2.sourceHandle &&
    e1.target === e2.target &&
    e1.targetHandle === e2.targetHandle
  );
}

function makeFlowCon(con: Connection): Flow.Connection {
  return {
    source: con.source.nodeId,
    target: con.dest.nodeId,
    sourceHandle: `output-${con.source.terminalIndex}`,
    targetHandle: `input-${con.dest.terminalIndex}`,
  };
}

export function convertConnection(connection: Flow.Connection): Connection {
  const sourceHandleIdx = parseInt(
    NotNull(connection.sourceHandle).replace("output-", "")
  );
  const targetHandleIdx = parseInt(
    NotNull(connection.targetHandle?.replace("input-", ""))
  );

  return {
    source: {
      type: TerminalType.Output,
      nodeId: NotNull(connection.source),
      terminalIndex: sourceHandleIdx,
    },
    dest: {
      type: TerminalType.Input,
      nodeId: NotNull(connection.target),
      terminalIndex: targetHandleIdx,
    },
    condition: new Condition([]),
  };
}

export class GraphEditor {
  private readonly nodeIdxRef: React.RefObject<number>;
  private readonly setNodes: Dispatch<SetStateAction<Node<NodeDefinition>[]>>;
  private readonly setEdges: Dispatch<SetStateAction<Flow.Edge<Connection>[]>>;
  readonly settings: Map<string, NodeSetting>;

  constructor(
    nodeIdxRef: React.RefObject<number>,
    setNodes: Dispatch<SetStateAction<Node<NodeDefinition>[]>>,
    setEdges: Dispatch<SetStateAction<Flow.Edge<Connection>[]>>,
    settings: Map<string, NodeSetting>
  ) {
    this.nodeIdxRef = nodeIdxRef;
    this.setNodes = setNodes;
    this.setEdges = setEdges;
    this.settings = settings;
  }

  AddBusinessConnection(con: Connection) {
    const newFlowCon = makeFlowCon(con);

    this.setEdges((eds) => {
      Assert(!eds.some((e) => edgeMatches(e, newFlowCon)));

      return [
        ...eds,
        {
          id: `edge-${this.nodeIdxRef.current++}`,
          type: "animated",
          ...newFlowCon,
          data: con,
        },
      ];
    });
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
          type: "animated",
          // type: "straight",
          ...flowCon,
          data: convertConnection(flowCon),
        });
      }

      return ret;
    });
  }

  AddNode(
    componentType: ComponentType,
    position: XYPosition
  ): Node<NodeDefinition> {
    const defn = GetNodeDefinition(componentType);
    const id = `node-${this.nodeIdxRef.current++}`;

    this.settings.set(id, makeDefaultSettings(defn.settingType));

    const node = {
      id,
      type: defn.style.style === NodeStyle.Constant ? "constant" : "compound",
      position: position,
      data: defn,
    };

    this.setNodes((nds) => [...nds, node]);

    return node;
  }

  RemoveNode(node: Flow.Node<NodeDefinition>) {
    this.setNodes((nds) => nds.filter((n) => n.id != node.id));
    this.setEdges((edgs) =>
      edgs.filter((e) => e.source != node.id && e.target != node.id)
    );
    this.settings.delete(node.id);
  }
}

export const GraphEditorContext = createContext<GraphEditor>(
  null as unknown as GraphEditor
);
