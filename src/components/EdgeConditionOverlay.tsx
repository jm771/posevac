import { Core, EdgeSingular, NodeSingular } from "cytoscape";
import React, { useEffect, useRef } from "react";
import { useState } from "react";
import assert from "assert";

// TODO this can get moved somewhere more shared
class RenderedPosition {
  x: number;
  y: number;
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
}

function getRenderedPosition(node: NodeSingular): RenderedPosition {
  const zoom = node.cy().zoom();
  const pan = node.cy().pan();
  const renderedX = node.position().x * zoom + pan.x;
  const renderedY = node.position().y * zoom + pan.y;
  return new RenderedPosition(renderedX, renderedY);
}

function midpoint(p1: RenderedPosition, p2: RenderedPosition) {
  return new RenderedPosition((p1.x + p2.x) / 2, (p1.y + p2.y) / 2);
}

function getEdgeCenter(edge: EdgeSingular): RenderedPosition {
  return midpoint(
    getRenderedPosition(edge.source()),
    getRenderedPosition(edge.target())
  );
}

export function EdgeConditionOverlay({ cy }: { cy: Core }) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [textValue, setTextValue] = useState<string>("");
  const [selectedEdge, setSelectedEdge] = useState<EdgeSingular | null>(null);

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

  cy.on("zoom pan viewport", () => {
    setSelectedEdge(selectedEdge); // Force update hopefully. Really I should set zoom and pan as dependencies
  });

  const pos = selectedEdge && getEdgeCenter(selectedEdge);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    assert(inputRef.current);
    const input = inputRef.current as HTMLInputElement;

    if (e.key === "Enter") {
      input.blur();
    } else if (e.key === "Escape") {
      setTextValue(selectedEdge?.data("condition"));
      input.blur();
    }
  }

  return (
    selectedEdge && (
      <input
        ref={inputRef}
        type="text"
        className="edge-condition-input"
        value={textValue}
        placeholder="condition..."
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        onInput={() => selectedEdge?.data("condition", inputRef.current?.value)}
        onBlur={() => {
          selectedEdge?.data("condition", textValue);
          setTimeout(() => setSelectedEdge(null), 100);
        }}
        onKeyDown={handleKeyDown}
        style={{
          left: pos?.x,
          right: pos?.y,
          transform: "translate(-50%, -50%)",
        }}
      />
    )
  );
}
