import { Edge, Node } from "@xyflow/react";
import { Condition } from "./condition";
import { NodeSetting } from "./contexts/node_settings_context";
import { NodeDefinition } from "./node_definitions";
import { NotNull } from "./util";

type NodeId = string;
type TerminalIndex = number;

export enum TerminalType {
  Input,
  Output,
}

export type TerminalId = {
  type: TerminalType;
  nodeId: NodeId;
  terminalIndex: TerminalIndex;
};

function TerminalIdToString(t: TerminalId) {
  return `${t.nodeId}-${t.type}-${t.terminalIndex}`;
}

export function terminalEquals(a: TerminalId, b: TerminalId) {
  return (
    a.type === b.type &&
    a.nodeId === b.nodeId &&
    a.terminalIndex === b.terminalIndex
  );
}

export type Connection = {
  source: TerminalId;
  dest: TerminalId;
  condition: Condition;
};

export function ConnectionToString(conn: Connection) {
  return `(${TerminalIdToString(conn.source)})->(${TerminalIdToString(
    conn.dest
  )})`;
}

export class PosFlo {
  nodes: Node<NodeDefinition>[];
  connections: Edge<Connection>[];
  nodeSettings: Map<NodeId, NodeSetting>;

  constructor(
    nodes: Node<NodeDefinition>[],
    connections: Edge<Connection>[],
    nodeSettings: Map<NodeId, NodeSetting>
  ) {
    this.nodes = nodes;
    this.connections = connections;
    this.nodeSettings = nodeSettings;
  }

  GetConnectionsForTerminal(terminal: TerminalId): Connection[] {
    if (terminal.type === TerminalType.Input) {
      return this.connections
        .filter((c) => terminalEquals(NotNull(c.data).dest, terminal))
        .map((conn) => NotNull(conn.data));
    } else {
      return this.connections
        .filter((c) => terminalEquals(NotNull(c.data).source, terminal))
        .map((conn) => NotNull(conn.data));
    }
  }
}
