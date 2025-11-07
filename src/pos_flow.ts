import { Condition } from "./condition";
import { NodeDefinition } from "./node_definitions";
import { ComputeNode } from "./nodes";
import { Assert } from "./util";

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
  nodes: ComputeNode[];
  connections: Connection[];
  onUpdate: Function;
  private nodeIdCounter = 0;

  constructor(initalNodes: ComputeNode[] = []) {
    this.nodes = initalNodes;
    this.connections = [];
    this.onUpdate = () => {}
  }

  GetConnectionsForTerminal(terminal: TerminalId): Connection[] {
    if (terminal.type === TerminalType.Input) {
      return this.connections.filter((c) => c.source == terminal);
    } else {
      return this.connections.filter((c) => c.dest == terminal);
    }
  }

  AddNode(defn: NodeDefinition): ComputeNode {
    const ret = new ComputeNode(defn, `node-${this.nodeIdCounter++}`);
    this.nodes.push(ret);
    return ret;
  }

  private GetEdgeIndex(connection: Connection): number {
    return this.connections.findIndex(
      (con) => con.dest === connection.dest && con.source === connection.source
    );
  }

  AddConnection(connection: Connection) {
    this.connections.push(connection);
  }

  HasConnection(connection: Connection) {
    return this.GetEdgeIndex(connection) !== -1;
  }

  RemoveConnection(connection: Connection) {
    const idx = this.GetEdgeIndex(connection);
    Assert(idx !== -1);
    this.connections.splice(idx, 1);
  }
}
