import { Connection, TerminalId } from "./pos_flow";

export class ProgramCounter {
  contents: unknown;
  currentLocation: TerminalId;
  currentEdge: Connection | null;
  id: string;

  constructor(
    location: TerminalId,
    edge: Connection | null,
    contents: unknown
  ) {
    this.contents = contents;
    this.currentLocation = location;
    this.currentEdge = edge;

    this.id = `pc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
