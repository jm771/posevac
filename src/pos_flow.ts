import { Condition } from "./condition";
import { NodeDefinition } from "./node_definitions";
import { ComputeNode } from "./nodes";

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
  private nodeIdCounter = 0;

  constructor(initalNodes: ComputeNode[] = []) {
    this.nodes = initalNodes;
    this.connections = [];
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

  //   AddNode(node: CompNode) {}

  //   AddConnection(connection: Connection) {}

  //   RemoveConnection(connection: Connection) {}
}
