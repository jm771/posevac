import React from "react";
import { useNavigate } from "react-router";
import { resetAnimation, stepForward } from "../animation";
import { LevelContext } from "../editor_context";

export function AnimationControls({
  levelContext,
}: {
  levelContext: LevelContext;
}) {
  const navigate = useNavigate();

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
