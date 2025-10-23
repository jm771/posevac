import cytoscape, { Core, EdgeSingular } from "cytoscape";
import React, { useEffect, useRef } from "react";
import { useState } from "react";
import { Assert } from "../util";
// TODO this can get moved somewhere more shared
class RenderedPosition {
  x: number;
  y: number;
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
}

function getRenderedPosition(
  position: cytoscape.Position,
  panZoom: PanZoomState
): RenderedPosition {
  const renderedX = position.x * panZoom.zoom + panZoom.pan.x;
  const renderedY = position.y * panZoom.zoom + panZoom.pan.y;
  return new RenderedPosition(renderedX, renderedY);
}

function midpoint(
  p1: cytoscape.Position,
  p2: cytoscape.Position
): cytoscape.Position {
  return { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
}

function getEdgeCenter(edge: EdgeSingular): cytoscape.Position {
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

function styleForPosition(position: cytoscape.Position, panZoom: PanZoomState) {
  const renderedPos = getRenderedPosition(position, panZoom);
  return {
    left: renderedPos.x,
    top: renderedPos.y,
    transform: `translate(-50%, -50%) scale(${panZoom.zoom})`,
  };
}

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
