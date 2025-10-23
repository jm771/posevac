import { Core, EdgeSingular } from "cytoscape";
import React, { useEffect, useRef } from "react";
import { useState } from "react";
import { Assert } from "../util";
import {
  getEdgeCenter,
  PanZoomState,
  styleForPosition,
} from "../rendered_position";

export function EdgeConditionOverlay({
  cy,
  panZoom,
}: {
  cy: Core;
  panZoom: PanZoomState;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [textValue, setTextValue] = useState<string>("");
  const [selectedEdge, setSelectedEdge] = useState<EdgeSingular | null>(null);
  const [, setUpdateCommitted] = useState<boolean>(false);

  useEffect(() => {
    if (selectedEdge) {
      inputRef.current?.select();
      inputRef.current?.focus();
      setTextValue(selectedEdge.data("condition"));
    }
  }, [selectedEdge]);

  cy.on("tap", "edge", (evt) => {
    setSelectedEdge(evt.target as EdgeSingular);
  });

  cy.on("tap", (evt) => {
    if (evt.target === cy) {
      setSelectedEdge(null);
    }
  });

  cy.on("tap", "node", () => {
    setSelectedEdge(null);
  });

  function commitUpdate() {
    setUpdateCommitted((x) => {
      if (!x) {
        selectedEdge?.data("condition", textValue);
      }

      return true;
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    Assert(inputRef.current !== null);
    const input = inputRef.current as HTMLInputElement;

    if (e.key === "Enter") {
      input.blur();
    } else if (e.key === "Escape") {
      setUpdateCommitted(true);
      input.blur();
    }
  }

  const pos = selectedEdge && getEdgeCenter(selectedEdge);

  return (
    selectedEdge && (
      <input
        ref={inputRef}
        type="text"
        className="edge-condition-input"
        value={textValue}
        onChange={(e) => setTextValue(e.target.value)}
        placeholder="condition..."
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        onFocus={() => setUpdateCommitted(false)}
        onBlur={() => {
          commitUpdate();
          setTimeout(() => setSelectedEdge(null), 100);
        }}
        onKeyDown={handleKeyDown}
        style={styleForPosition(pos!, panZoom)}
      />
    )
  );
}
