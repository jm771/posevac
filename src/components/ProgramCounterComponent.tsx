import cytoscape from "cytoscape";
import React, { useContext } from "react";
import { PanZoomContext, styleForPosition } from "../rendered_position";

export function ProgramCounterComponent({
  position,
  text,
}: {
  position: cytoscape.Position;
  text: string;
  angle: number;
}) {
  const panZoom = useContext(PanZoomContext);

  return (
    <span className="pc-box" style={styleForPosition(position, panZoom)}>
      {text}
    </span>
  );
}
