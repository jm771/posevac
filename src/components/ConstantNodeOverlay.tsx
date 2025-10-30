import { Core, EventObject, NodeSingular } from "cytoscape";
import React, { useContext, useEffect, useRef, useState } from "react";
import { PanZoomContext, styleForPosition } from "../rendered_position";

export function initializeNodeLabelStyling(cy: Core) {
  // // @ts-ignore - nodeHtmlLabel is added by extension
  // cy.nodeHtmlLabel([
  //   {
  //     query: 'node[type="constant"]',
  //     cssClass: "constant-node-display",
  //     tpl: function (data: ConstantNodeData) {
  //       const value = data.constantValue !== undefined ? data.constantValue : 0;
  //       const repeat =
  //         data.constantRepeat !== undefined ? data.constantRepeat : true;
  //       const modeIcon = repeat ? "∞" : "1×";
  //       const modeClass = repeat ? "repeat" : "once";
  //       return `
  //               <div class="constant-display">
  //                   <div class="constant-display-value">${value}</div>
  //                   <div class="constant-display-mode ${modeClass}">${modeIcon}</div>
  //               </div>
  //           `;
  //     },
  //   },
  // ]);
}

export function ConstantNodeOverlay({ cy }: { cy: Core }) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const toggleRef = useRef<HTMLButtonElement | null>(null);
  const [selectedNode, setSelectedNode] = useState<NodeSingular | null>(null);
  const [nodeDataVer, setNodeDataVer] = useState<number>(0);
  const incNodeDataVer = () => setNodeDataVer((x) => x + 1);

  const selectNode = (node: NodeSingular | null) => {
    setSelectedNode((old) => {
      old?.grabify();
      node?.ungrabify();
      return node;
    });
  };

  const panZoom = useContext(PanZoomContext);

  // // useEffect(() => {
  // //   const dataHandler = () => {
  // //     // @ts-ignore
  // //     cy.nodeHtmlLabel("refresh");
  // //   };
  // //   cy.on("data", 'node[type="constant"]', dataHandler);

  // //   return () => {
  // //     cy.off("data", 'node[type="constant"]', dataHandler);
  // //   };
  // }, [cy]);

  useEffect(() => {
    if (selectedNode) {
      inputRef.current?.select();
      inputRef.current?.focus();
    }
  }, [selectedNode]);

  useEffect(() => {
    function backgroundTapHandler(evt: EventObject) {
      console.log("background");
      if (evt.target === cy) {
        selectNode(null);
      }
    }

    function edgeTapHandler() {
      selectNode(null);
    }

    function nodeTapHandler(evt: EventObject) {
      console.log("node tap");
      const node = evt.target as NodeSingular;
      if (node.data("type") !== "constant") {
        selectNode(null);
      } else {
        // node.ungrabify();
        selectNode(node);
      }
    }

    cy.on("tap", backgroundTapHandler);
    cy.on("tap", "node", nodeTapHandler);
    cy.on("tap", "edge", edgeTapHandler);

    return () => {
      cy.off("tap", backgroundTapHandler);
      cy.off("tap", "node", nodeTapHandler);
      cy.off("tap", "edge", edgeTapHandler);
    };
  }, [cy]);

  function handleValueChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newValue = e.target.value;
    let parsedValue: unknown = newValue;
    const numValue = Number(newValue);
    if (!isNaN(numValue) && newValue.trim() !== "") {
      parsedValue = numValue;
    }

    selectedNode?.data("constantValue", parsedValue);
    incNodeDataVer();
  }

  function handleToggleClick(e: React.MouseEvent<HTMLButtonElement>) {
    console.log("handle toggle clicked");
    e.stopPropagation();
    selectedNode?.data("constantRepeat", !selectedNode?.data("constantRepeat"));
    incNodeDataVer();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === "Escape") {
      inputRef.current?.blur();
    }
  }

  function handleBlur() {
    setTimeout(() => {
      // Only close if we're not clicking the toggle button
      if (document.activeElement !== toggleRef.current) {
        selectNode(null);
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
          value={selectedNode.data("constantValue")}
          onChange={handleValueChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
        />
        <button
          ref={toggleRef}
          className={`constant-toggle-button ${
            selectedNode.data("constantRepeat") ? "repeat" : "once"
          }`}
          onClick={handleToggleClick}
        >
          {selectedNode.data("constantRepeat") ? "REPEAT" : "ONCE"}
        </button>
      </div>
    )
  );
}
