import { Connection, terminalEquals, TerminalId } from "./pos_flow";
import { Assert, NotNull } from "./util";

export type ProgramCounterId = string;

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

export class PCStore {
  private programCounters: ProgramCounter[] = [];

  constructor() {}

  Add(pc: ProgramCounter) {
    this.programCounters.push(pc);
  }

  Remove(pc: ProgramCounter) {
    const idx = this.programCounters.findIndex((pc1) => pc1.id === pc.id);
    Assert(idx !== -1);
    this.programCounters.splice(idx, 1);
  }

  GetById(id: ProgramCounterId): ProgramCounter {
    return NotNull(this.programCounters.find((pc) => pc.id === id));
  }

  GetByTerminal(id: TerminalId): ProgramCounter[] {
    return NotNull(
      this.programCounters.filter((pc) =>
        terminalEquals(pc.currentLocation, id)
      )
    );
  }

  AdvancePc(pc: ProgramCounter) {
    pc.currentLocation = NotNull(pc.currentEdge).dest;
    pc.currentEdge = null;
  }

  GetAll(): ProgramCounter[] {
    return this.programCounters;
  }
}
