import { Edge, Node } from "@xyflow/react";
import { Condition } from "./condition";
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

export type Connection = {
  source: TerminalId;
  dest: TerminalId;
  condition: Condition;
};

export class PosFlo {
  nodes: Node<NodeDefinition>[];
  connections: Edge<Connection>[];

  constructor(nodes: Node<NodeDefinition>[], connections: Edge<Connection>[]) {
    this.nodes = nodes;
    this.connections = connections;
  }

  GetConnectionsForTerminal(terminal: TerminalId): Connection[] {
    if (terminal.type === TerminalType.Input) {
      return this.connections
        .filter((c) => NotNull(c.data).source == terminal)
        .map((conn) => NotNull(conn.data));
    } else {
      return this.connections
        .filter((c) => NotNull(c.data).dest == terminal)
        .map((conn) => NotNull(conn.data));
    }
  }
}
