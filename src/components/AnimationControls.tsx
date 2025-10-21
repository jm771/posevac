import React from "react";
import { useNavigate } from "react-router";

export function AnimationControls() {
  const navigate = useNavigate();
  return (
    <>
      <h3>Animation</h3>
      <div className="controls">
        <button id="resetBtn" className="control-btn">
          ⟲ Reset
        </button>
        <button id="forwardBtn" className="control-btn">
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
