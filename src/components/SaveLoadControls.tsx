import React, { useRef } from "react";
import { NavigateFunction, useNavigate } from "react-router";
import { LevelContext } from "../editor_context";
import { downloadGraphAsJSON, loadGraphFromFile } from "../graph_serialization";

function MakeFileSelectedHandler(
  naviage: NavigateFunction
): (event: React.ChangeEvent<HTMLInputElement>) => void {
  return (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      loadGraphFromFile(naviage, file);
    } catch (error) {
      alert(
        `Error loading graph: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };
}

function downloadGraph(context: LevelContext) {
  try {
    downloadGraphAsJSON(context.editorContext);
  } catch (error) {
    alert(
      `Error saving graph: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export function SaveLoadControls({ context }: { context: LevelContext }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  return (
    <>
      <h3>Graph</h3>
      <div className="controls">
        <button
          id="saveBtn"
          className="control-btn"
          onClick={() => downloadGraph(context)}
        >
          💾 Save
        </button>
        <button
          id="loadBtn"
          className="control-btn"
          onClick={() => fileInputRef?.current?.click()}
        >
          📂 Load
        </button>
        <input
          ref={fileInputRef}
          type="file"
          onChange={MakeFileSelectedHandler(navigate)}
          id="fileInput"
          accept=".json"
          style={{ display: "none" }}
        />
      </div>
    </>
  );
}
