import cytoscape, { EdgeSingular, NodeSingular } from "cytoscape";
import { createContext } from "react";
import { Assert } from "./util";

export class RenderedPosition {
  x: number;
  y: number;
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
}

export function getRenderedPosition(
  position: cytoscape.Position,
  panZoom: PanZoomState
): RenderedPosition {
  const renderedX = position.x * panZoom.zoom + panZoom.pan.x;
  const renderedY = position.y * panZoom.zoom + panZoom.pan.y;
  return new RenderedPosition(renderedX, renderedY);
}

export function getRenderedPositionOfNode(node: NodeSingular) {
  const cyContainer = node.cy().container();
  Assert(cyContainer !== null);
  const cyBounds = cyContainer!.getBoundingClientRect();
  const renderedPos = node.renderedPosition();

  return new RenderedPosition(
    cyBounds.left + renderedPos.x,
    cyBounds.top + renderedPos.y
  );
}

export function midpoint(
  p1: cytoscape.Position,
  p2: cytoscape.Position
): cytoscape.Position {
  return { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
}

export function getEdgeCenter(edge: EdgeSingular): cytoscape.Position {
  return midpoint(edge.source().position(), edge.target().position());
}

export class PanZoomState {
  pan: cytoscape.Position;
  zoom: number;

  constructor(pan = { x: 0, y: 0 }, zoom = 1) {
    this.pan = pan;
    this.zoom = zoom;
  }
}

export function styleForPosition(
  position: cytoscape.Position,
  panZoom: PanZoomState
) {
  // .renderedPosition() might be the more sane thing  here...
  const renderedPos = getRenderedPosition(position, panZoom);
  return {
    left: renderedPos.x,
    top: renderedPos.y,
    // transform: `translate(-50%, -50%) scale(${panZoom.zoom})`,
  };
}

export function motionTargetForPosition(
  position: cytoscape.Position,
  panZoom: PanZoomState
) {
  // .renderedPosition() might be the more sane thing  here...
  const renderedPos = getRenderedPosition(position, panZoom);
  return {
    top: 0,
    left: 0,
    x: renderedPos.x,
    y: renderedPos.y,
    // transform: `translate(-50%, -50%) scale(${panZoom.zoom})`,
  };
}

export const PanZoomContext = createContext<PanZoomState>(new PanZoomState());
