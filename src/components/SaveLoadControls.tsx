import React, { useContext, useRef } from "react";
import {
  GraphEditor,
  GraphEditorContext,
} from "../contexts/graph_editor_context";
import { PosFloContext } from "../contexts/pos_flo_context";
import {
  exportGraph,
  importGraph,
  loadGraphFromFile,
  SerializedGraph,
} from "../graph_serialization";
import { PosFlo } from "../pos_flow";

function loadGraphFromFile(
  editor: GraphEditor,
  levelId: string,
  file: File
): Promise<void> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const json = event.target?.result as string;
        const serialized = JSON.parse(json) as SerializedGraph;
        importGraph(serialized, levelId, editor);
        resolve();
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    reader.readAsText(file);
  });
}

function MakeFileSelectedHandler(
  editor: GraphEditor,
  levelId: string
): (event: React.ChangeEvent<HTMLInputElement>) => Promise<void> {
  return async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await loadGraphFromFile(editor, levelId, file);
    } catch (error) {
      alert(
        `Error loading graph: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };
}

function downloadGraph(posFlo: PosFlo, levelId: string) {
  try {
    const serialized = exportGraph(posFlo, levelId);
    const json = JSON.stringify(serialized, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `graph-${levelId}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    alert(
      `Error saving graph: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export function SaveLoadControls({ levelId }: { levelId: string }) {
  const posFlo = useContext(PosFloContext);
  const editor = useContext(GraphEditorContext);

  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <h3>Graph</h3>
      <div className="controls">
        <button
          id="saveBtn"
          className="control-btn"
          onClick={() => downloadGraph(posFlo, levelId)}
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
          onChange={MakeFileSelectedHandler(editor, levelId)}
          id="fileInput"
          accept=".json"
          style={{ display: "none" }}
        />
      </div>
    </>
  );
}
