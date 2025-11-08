import React, { useRef } from "react";
// import { downloadGraphAsJSON, loadGraphFromFile } from "../graph_serialization";
// import { LevelContext } from "../editor_context";

// function MakeFileSelectedHandler(
//   levelContext: LevelContext
// ): (event: React.ChangeEvent<HTMLInputElement>) => Promise<void> {
//   return async (event: React.ChangeEvent<HTMLInputElement>) => {
//     const file = event.target.files?.[0];
//     if (!file) return;

//     try {
//       await loadGraphFromFile(levelContext.editorContext, file);
//     } catch (error) {
//       alert(
//         `Error loading graph: ${
//           error instanceof Error ? error.message : "Unknown error"
//         }`
//       );
//     }
//   };
// }

// function downloadGraph(context: LevelContext) {
//   try {
//     downloadGraphAsJSON(context.editorContext);
//   } catch (error) {
//     alert(
//       `Error saving graph: ${
//         error instanceof Error ? error.message : "Unknown error"
//       }`
//     );
//   }
// }

export function SaveLoadControls() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <h3>Graph</h3>
      <div className="controls">
        <button
          id="saveBtn"
          className="control-btn"
          // onClick={() => downloadGraph(context)}
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
          // onChange={MakeFileSelectedHandler(context)}
          id="fileInput"
          accept=".json"
          style={{ display: "none" }}
        />
      </div>
    </>
  );
}
