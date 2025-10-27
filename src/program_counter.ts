import { EdgeSingular, NodeSingular } from "cytoscape";
import { DefaultMap } from "./util";

export class ProgramCounter {
  contents: unknown;
  currentLocation: NodeSingular;
  currentEdge: EdgeSingular | null;
  id: string;

  constructor(
    location: NodeSingular,
    edge: EdgeSingular | null,
    contents: unknown
  ) {
    this.contents = contents;
    this.currentLocation = location;
    this.currentEdge = edge;

    this.id = `pc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  tryAdvance(
    terminalToProgramCounters: DefaultMap<string, Map<string, ProgramCounter>>
  ): NodeSingular | null {
    if (this.currentEdge != null) {
      const dest = this.currentEdge.target();
      const destPcs = terminalToProgramCounters.get(dest.id());
      if (destPcs.size === 0) {
        destPcs.set(this.id, this);
        terminalToProgramCounters
          .get(this.currentLocation.id())
          .delete(this.id);
        this.currentEdge = null;
        this.currentLocation = dest;
        return dest;
      }
    }

    return null;
  }
}
