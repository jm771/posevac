import React from "react";
import { PanZoomState, styleForPosition } from "../rendered_position";
import cytoscape from "cytoscape";

export function ProgramCounterComponent({
  position,
  text,
  panZoom,
}: {
  position: cytoscape.Position;
  text: string;
  panZoom: PanZoomState;
}) {
  return (
    <span
      className="pc-box"
      //   id={`pcBox-${uniqueId}`}
      style={styleForPosition(position, panZoom)}
    >
      {text}
    </span>
  );
}
