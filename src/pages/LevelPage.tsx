import React, { useEffect, useState } from "react";
import { getLevelById } from "../levels";
import { useParams } from "react-router";
import { startLevel } from "../app";
import { EditorSidebar } from "../components/Sidebar";
import { AnimationControls } from "../components/AnimationControls";
import { SaveLoadControls } from "../components/SaveLoadControls";
import { GraphEditorContext, LevelContext } from "../editor_context";

export function LevelPage() {
  const { levelId } = useParams<{ levelId: string }>();
  if (levelId === undefined) {
    throw Error("missing level id");
  }

  const level = getLevelById(levelId);
  const [levelContext, setLevelContext] = useState<LevelContext | null>(null);

  useEffect(() => {
    const levelContext = new LevelContext(new GraphEditorContext(level), null);
    setLevelContext(levelContext);
    startLevel(levelContext);
    return () => levelContext.destroy();
  }, []);

  return (
    <div className="container" id="graphEditor">
      {levelContext !== null && (
        <aside className="sidebar" id="sidebar">
          <div className="level-info">
            <h2 id="levelName">{level.name}</h2>
            <p id="levelDescription">{level.description}</p>
          </div>
          <h3>Components</h3>
          <EditorSidebar level={level} />
          <div className="delete-zone" id="deleteZone">
            <span>Drop here to delete</span>
          </div>
        </aside>
      )}

      <main className="canvas-container">
        <div id="cy"></div>
      </main>

      {levelContext !== null && (
        <aside className="controls-panel" id="controlsPanel">
          <AnimationControls />
          <SaveLoadControls context={levelContext} />
        </aside>
      )}
    </div>
  );
}
