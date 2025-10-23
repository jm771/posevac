import { Core, NodeSingular, EventObject } from "cytoscape";
import React, { useContext, useEffect, useRef, useState } from "react";
import { PanZoomContext, styleForPosition } from "../rendered_position";

export function ConstantNodeOverlay({ cy }: { cy: Core }) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const toggleRef = useRef<HTMLButtonElement | null>(null);
  const [value, setValue] = useState<string>("");
  const [repeat, setRepeat] = useState<boolean>(true);
  const [selectedNode, setSelectedNode] = useState<NodeSingular | null>(null);
  const [originalValue, setOriginalValue] = useState<any>(0);
  const [originalRepeat, setOriginalRepeat] = useState<boolean>(true);
  const panZoom = useContext(PanZoomContext);

  // Initialize nodeHtmlLabel for constant nodes
  useEffect(() => {
    // @ts-ignore - nodeHtmlLabel is added by extension
    cy.nodeHtmlLabel([
      {
        query: 'node[type="constant"]',
        halign: "center",
        valign: "center",
        halignBox: "center",
        valignBox: "center",
        cssClass: "constant-node-display",
        tpl: function (data: any) {
          const value =
            data.constantValue !== undefined ? data.constantValue : 0;
          const repeat =
            data.constantRepeat !== undefined ? data.constantRepeat : true;
          const modeIcon = repeat ? "∞" : "1×";
          const modeClass = repeat ? "repeat" : "once";

          return `
                <div class="constant-display">
                    <div class="constant-display-value">${value}</div>
                    <div class="constant-display-mode ${modeClass}">${modeIcon}</div>
                </div>
            `;
        },
      },
    ]);

    // Refresh HTML labels when data changes
    const dataHandler = () => {
      // @ts-ignore
      cy.nodeHtmlLabel("refresh");
    };
    cy.on("data", 'node[type="constant"]', dataHandler);

    return () => {
      cy.off("data", 'node[type="constant"]', dataHandler);
    };
  }, [cy]);

  // Set up event listeners for constant node taps
  useEffect(() => {
    function constantNodeTapHandler(evt: EventObject) {
      const node = evt.target as NodeSingular;
      setSelectedNode(node);
    }

    function backgroundTapHandler(evt: EventObject) {
      if (evt.target === cy) {
        setSelectedNode(null);
      }
    }

    function otherNodeTapHandler(evt: EventObject) {
      const node = evt.target as NodeSingular;
      if (node.data("type") !== "constant") {
        setSelectedNode(null);
      }
    }

    function edgeTapHandler() {
      setSelectedNode(null);
    }

    cy.on("tap", 'node[type="constant"]', constantNodeTapHandler);
    cy.on("tap", backgroundTapHandler);
    cy.on("tap", "node", otherNodeTapHandler);
    cy.on("tap", "edge", edgeTapHandler);

    return () => {
      cy.off("tap", 'node[type="constant"]', constantNodeTapHandler);
      cy.off("tap", backgroundTapHandler);
      cy.off("tap", "node", otherNodeTapHandler);
      cy.off("tap", "edge", edgeTapHandler);
    };
  }, [cy]);

  // Update state when selected node changes
  useEffect(() => {
    if (selectedNode) {
      const currentValue =
        selectedNode.data("constantValue") !== undefined
          ? selectedNode.data("constantValue")
          : 0;
      const currentRepeat =
        selectedNode.data("constantRepeat") !== undefined
          ? selectedNode.data("constantRepeat")
          : true;

      setValue(String(currentValue));
      setRepeat(currentRepeat);
      setOriginalValue(currentValue);
      setOriginalRepeat(currentRepeat);

      inputRef.current?.select();
      inputRef.current?.focus();
    }
  }, [selectedNode]);

  function handleValueChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newValue = e.target.value;
    setValue(newValue);

    let parsedValue: any = newValue;
    const numValue = Number(newValue);
    if (!isNaN(numValue) && newValue.trim() !== "") {
      parsedValue = numValue;
    }
    selectedNode?.data("constantValue", parsedValue);
  }

  function handleToggleClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.stopPropagation();
    const newRepeat = !repeat;
    setRepeat(newRepeat);
    selectedNode?.data("constantRepeat", newRepeat);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      inputRef.current?.blur();
    } else if (e.key === "Escape") {
      // Restore original values
      selectedNode?.data("constantValue", originalValue);
      selectedNode?.data("constantRepeat", originalRepeat);
      inputRef.current?.blur();
    }
  }

  function handleBlur() {
    setTimeout(() => {
      // Only close if we're not clicking the toggle button
      if (document.activeElement !== toggleRef.current) {
        setSelectedNode(null);
      }
    }, 100);
  }

  const pos = selectedNode?.position();

  return (
    selectedNode && (
      <div
        className="constant-editor-container"
        style={styleForPosition(pos!, panZoom)}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          type="text"
          className="constant-value-input"
          value={value}
          onChange={handleValueChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
        />
        <button
          ref={toggleRef}
          className={`constant-toggle-button ${repeat ? "repeat" : "once"}`}
          onClick={handleToggleClick}
        >
          {repeat ? "REPEAT" : "ONCE"}
        </button>
      </div>
    )
  );
}
