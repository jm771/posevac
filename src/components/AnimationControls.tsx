import React, { useEffect } from "react";
import { useNavigate } from "react-router";
import {
  resetAnimation,
  stepForward,
  updatePCMarkerForViewportChange,
} from "../animation";
import { LevelContext } from "../editor_context";

export function AnimationControls({
  levelContext,
}: {
  levelContext: LevelContext;
}) {
  const navigate = useNavigate();

  useEffect(() => {
    function panZoomCallback() {
      updatePCMarkerForViewportChange(levelContext);
    }

    function positionCallback() {
      updatePCMarkerForViewportChange(levelContext);
    }

    levelContext.editorContext.cy.on("pan zoom", panZoomCallback);
    levelContext.editorContext.cy.on("position", "node", positionCallback);

    return () => {
      levelContext.editorContext.cy.off("pan zoom", panZoomCallback);
      levelContext.editorContext.cy.off("position", "node", positionCallback);
    };
  }, [levelContext]);

  return (
    <>
      <h3>Animation</h3>
      <div className="controls">
        <button
          id="resetBtn"
          className="control-btn"
          onClick={() => resetAnimation(levelContext)}
        >
          ⟲ Reset
        </button>
        <button
          id="forwardBtn"
          className="control-btn"
          onClick={() => stepForward(levelContext)}
        >
          ► Forward
        </button>
        <button
          id="menuBtn"
          className="control-btn menu-btn"
          onClick={() => navigate("/")}
        >
          ◄ Menu
        </button>
      </div>
    </>
  );
}
