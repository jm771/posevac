import { Core, EdgeSingular, EventObject } from "cytoscape";
import React, { useContext, useEffect, useState } from "react";
import { Condition, Matcher } from "../condition";
import {
  getEdgeCenter,
  PanZoomContext,
  styleForPosition,
} from "../rendered_position";

const MATCHER_LABELS = {
  [Matcher.Wild]: "*",
  [Matcher.Zero]: "0",
  [Matcher.One]: "1",
};

export function EdgeConditionOverlay({ cy }: { cy: Core }) {
  const [selectedEdge, setSelectedEdge] = useState<EdgeSingular | null>(null);
  const [, setConditionVersion] = useState<number>(0);
  const incConditionVersion = () => setConditionVersion((x) => x + 1);
  const panZoom = useContext(PanZoomContext);

  function nodeTapHandler() {
    setSelectedEdge(null);
  }

  function edgeTapHandler(evt: EventObject) {
    setSelectedEdge(evt.target as EdgeSingular);
  }

  useEffect(() => {
    function tapHandler(evt: EventObject) {
      if (evt.target === cy) {
        setSelectedEdge(null);
      }
    }

    cy.on("tap", "edge", edgeTapHandler);
    cy.on("tap", tapHandler);
    cy.on("tap", "node", nodeTapHandler);
    return () => {
      cy.off("tap", "edge", edgeTapHandler);
      cy.off("tap", tapHandler);
      cy.off("tap", "node", nodeTapHandler);
    };
  }, [cy]);

  function handleAddMatcher() {
    if (!selectedEdge) return;
    const condition = selectedEdge.data("condition") as Condition;
    const newMatchers = [...condition.matchers, Matcher.Wild];
    selectedEdge.data("condition", new Condition(newMatchers));
    incConditionVersion();
  }

  function handleCycleMatcher(index: number, e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    if (!selectedEdge) return;
    const condition = selectedEdge.data("condition") as Condition;
    const newMatchers = [...condition.matchers];
    // Cycle: Wild -> Zero -> One -> Wild
    newMatchers[index] = (newMatchers[index] + 1) % 3;
    selectedEdge.data("condition", new Condition(newMatchers));
    incConditionVersion();
  }

  function handleRemoveLastMatcher(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    if (!selectedEdge) return;
    const condition = selectedEdge.data("condition") as Condition;
    if (condition.matchers.length === 0) return;
    const newMatchers = condition.matchers.slice(0, -1);
    selectedEdge.data("condition", new Condition(newMatchers));
    incConditionVersion();
  }

  function handleAddMatcherClick(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    handleAddMatcher();
  }

  const pos = selectedEdge && getEdgeCenter(selectedEdge);
  const condition = selectedEdge?.data("condition") as Condition;
  return (
    selectedEdge && (
      <div
        className="edge-condition-input"
        style={styleForPosition(pos!, panZoom)}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="matcher-list">
          {condition.matchers.map((matcher, index) => (
            <button
              key={index}
              className="matcher-button"
              onClick={(e) => handleCycleMatcher(index, e)}
            >
              {MATCHER_LABELS[matcher]}
            </button>
          ))}
          <button className="matcher-add-button" onClick={handleAddMatcherClick}>
            +
          </button>
          {condition.matchers.length > 0 && (
            <button className="matcher-remove-button" onClick={handleRemoveLastMatcher}>
              −
            </button>
          )}
        </div>
      </div>
    )
  );
}
