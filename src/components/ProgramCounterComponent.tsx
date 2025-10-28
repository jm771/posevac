import cytoscape from "cytoscape";
import { motion } from "framer-motion";
import React, { useContext } from "react";
import { motionTargetForPosition, PanZoomContext } from "../rendered_position";

export function ProgramCounterComponent({
  position,
  text,
}: {
  startPosition: cytoscape.Position;
  position: cytoscape.Position;
  text: string;
  angle: number;
}) {
  const panZoom = useContext(PanZoomContext);
  //style={styleForPosition(position, panZoom)}>
  return (
    <motion.div
      className="pc-box"
      animate={motionTargetForPosition(position, panZoom)}
      transition={{ duration: 0.5 }}
      style={{ display: "flex" }}
    >
      {text}
    </motion.div>
  );
}
