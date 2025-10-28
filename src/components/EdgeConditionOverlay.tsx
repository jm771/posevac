import { Core, EdgeSingular, EventObject } from "cytoscape";
import React, { useContext, useEffect, useState } from "react";
import { Condition, Matcher, MATCHER_LABELS } from "../condition";
import {
  getEdgeCenter,
  PanZoomContext,
  styleForPosition,
} from "../rendered_position";

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

  // Disable panning when overlay is open
  useEffect(() => {
    if (selectedEdge) {
      cy.userPanningEnabled(false);
    } else {
      cy.userPanningEnabled(true);
    }

    return () => {
      cy.userPanningEnabled(true);
    };
  }, [selectedEdge, cy]);

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
    e.nativeEvent.stopImmediatePropagation();
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
    e.nativeEvent.stopImmediatePropagation();
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
    e.nativeEvent.stopImmediatePropagation();
    handleAddMatcher();
  }

  function stopEvent(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    e.nativeEvent.stopImmediatePropagation();
  }

  const pos = selectedEdge && getEdgeCenter(selectedEdge);
  const condition = selectedEdge?.data("condition") as Condition;
  return (
    selectedEdge && (
      <div
        className="edge-condition-input"
        style={styleForPosition(pos!, panZoom)}
        onMouseDown={stopEvent}
        onMouseUp={stopEvent}
        onClick={stopEvent}
      >
        <div className="matcher-list">
          <span>(</span>
          {condition.matchers.map((matcher, index) => (
            <React.Fragment key={index}>
              {index != 0 && <span>,</span>}
              <button
                className="matcher-button"
                onMouseDown={(e) => handleCycleMatcher(index, e)}
                onClick={stopEvent}
              >
                {MATCHER_LABELS[matcher]}
              </button>
            </React.Fragment>
          ))}
          <span>)</span>
          <button
            className="matcher-add-button"
            onMouseDown={handleAddMatcherClick}
            onClick={stopEvent}
          >
            +
          </button>
          {condition.matchers.length > 0 && (
            <button
              className="matcher-remove-button"
              onMouseDown={handleRemoveLastMatcher}
              onClick={stopEvent}
            >
              −
            </button>
          )}
        </div>
      </div>
    )
  );
}
