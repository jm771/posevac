import { Edge, useEdges, XYPosition } from "@xyflow/react";
import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Matcher, MATCHER_LABELS } from "../condition";
import { EdgePathContext } from "../contexts/edge_path_context";
import { Connection, ConnectionToString } from "../pos_flow";
import { NotNull } from "../util";

export function EdgeConditionComponent({ edge }: { edge: Edge<Connection> }) {
  const [, setConditionVersion] = useState<number>(0);
  const incConditionVersion = useCallback(
    () => setConditionVersion((x) => x + 1),
    [setConditionVersion]
  );

  const handleAddMatcher = useCallback(() => {
    if (!edge) return;
    const condition = NotNull(edge.data).condition;
    condition.matchers.push(Matcher.Wild);
    incConditionVersion();
  }, [edge, incConditionVersion]);

  function handleCycleMatcher(index: number, e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    e.nativeEvent.stopImmediatePropagation();
    if (!edge) return;
    const condition = NotNull(edge.data).condition;
    const matchers = condition.matchers;
    // Cycle: Wild -> Zero -> One -> Wild
    matchers[index] = (matchers[index] + 1) % 5;
    incConditionVersion();
  }

  function handleRemoveLastMatcher(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    e.nativeEvent.stopImmediatePropagation();
    if (!edge) return;
    const condition = NotNull(edge.data).condition;
    if (condition.matchers.length === 0) return;
    condition.matchers = condition.matchers.slice(0, -1);
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

  const condition = NotNull(edge.data).condition;
  return (
    <div
      className="edge-condition-input"
      onMouseDown={stopEvent}
      onMouseUp={stopEvent}
      onClick={stopEvent}
      style={{ transform: "translate(-50%, -50%) scale(0.7)" }}
    >
      <div className="matcher-list">
        {condition.matchers.length > 0 && <span>(</span>}
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
        {condition.matchers.length > 0 && <span>)</span>}
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
  );
}

export function EdgeConditionWrapper({ edge }: { edge: Edge<Connection> }) {
  const divRef = useRef<HTMLDivElement>(null);
  const { edgeCenterHandlers } = useContext(EdgePathContext);

  useEffect(() => {
    if (!divRef.current) return;

    const edgeStr = ConnectionToString(NotNull(edge.data));

    function callback(center: XYPosition) {
      if (!divRef.current) return;

      divRef.current.style.transform = `translate(${center.x}px, ${center.y}px)`;
    }

    edgeCenterHandlers.subscribe(edgeStr, callback);
    callback(edgeCenterHandlers.getLastData(edgeStr));

    return () => {
      edgeCenterHandlers.unsub(edgeStr, callback);
    };
  }, [edge, edgeCenterHandlers]);

  return (
    <div ref={divRef} style={{ position: "absolute" }}>
      <EdgeConditionComponent edge={edge} />
    </div>
  );
}

export function EdgeConditionOverlay() {
  const edges: Edge<Connection>[] = useEdges();

  return (
    <>
      {edges.map((edge: Edge<Connection>) => (
        <EdgeConditionWrapper key={`${edge.id}-overlay`} edge={edge} />
      ))}
    </>
  );
}
