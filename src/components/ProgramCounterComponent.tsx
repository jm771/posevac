import React, { useContext } from "react";
import { PanZoomContext, styleForPosition } from "../rendered_position";
import cytoscape from "cytoscape";

export function ProgramCounterComponent({
  position,
  text,
}: {
  position: cytoscape.Position;
  text: string;
}) {
  const panZoom = useContext(PanZoomContext);

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
