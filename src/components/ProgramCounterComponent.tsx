import cytoscape from "cytoscape";
import { motion } from "framer-motion";
import React, { useContext } from "react";
import { motionTargetForPosition, PanZoomContext } from "../rendered_position";

export function ProgramCounterComponent({
  position,
  text,
}: {
  position: cytoscape.Position;
  text: string;
  angle: number;
}) {
  const panZoom = useContext(PanZoomContext);
  //style={styleForPosition(position, panZoom)}>
  return (
    <motion.div
      className="pc-box"
      initial={{ ...motionTargetForPosition(position, panZoom, 0) }}
      exit={{ ...motionTargetForPosition(position, panZoom, 0) }}
      animate={{
        ...motionTargetForPosition(position, panZoom, 1),
      }}
      transition={{ duration: 0.5 }}
    >
      {text}
    </motion.div>
  );
}
