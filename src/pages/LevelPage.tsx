import React, { useEffect, useState } from "react";
import { getLevelById } from "../levels";
import { useParams } from "react-router";
import { startLevel } from "../app";
import { LevelSidebar } from "../components/Sidebar";
import { AnimationControls } from "../components/AnimationControls";
import { SaveLoadControls } from "../components/SaveLoadControls";
import { GraphEditorContext, LevelContext } from "../editor_context";
import { ComponentType, createNodeFromName } from "../nodes";
import { EdgeConditionOverlay } from "../components/EdgeConditionOverlay";
import { PanZoomContext, PanZoomState } from "../rendered_position";
import {
  ConstantNodeOverlay,
  initializeNodeLabelStyling,
} from "../components/ConstantNodeOverlay";

function handleDrop(
  levelContext: LevelContext | null,
  e: React.DragEvent<HTMLDivElement>
) {
  e.preventDefault();
  if (!e.dataTransfer) return;
  if (!levelContext) return;
  const context = levelContext.editorContext;

  const componentType = e.dataTransfer.getData(
    "component-type"
  ) as ComponentType;
  if (!componentType) return;

  const cyBounds = e.currentTarget.getBoundingClientRect();
  const renderedX = e.clientX - cyBounds.left;
  const renderedY = e.clientY - cyBounds.top;

  const pan = context.cy.pan();
  const zoom = context.cy.zoom();
  const modelX = (renderedX - pan.x) / zoom;
  const modelY = (renderedY - pan.y) / zoom;

  const newNode = createNodeFromName(context, componentType, modelX, modelY);

  context.allNodes.push(newNode);
}

function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
  e.preventDefault();
  e.dataTransfer.dropEffect = "copy";
}

export function LevelPage() {
  const { levelId } = useParams<{ levelId: string }>();
  if (levelId === undefined) {
    throw Error("missing level id");
  }

  const level = getLevelById(levelId);
  const [levelContext, setLevelContext] = useState<LevelContext | null>(null);
  const [panZoom, setPanZoom] = useState<PanZoomState>(new PanZoomState());

  useEffect(() => {
    const newLevelContext = new LevelContext(
      new GraphEditorContext(level),
      null
    );

    setLevelContext(newLevelContext);

    const cy = newLevelContext.editorContext.cy;
    initializeNodeLabelStyling(cy);

    const updateState = () => {
      setPanZoom(new PanZoomState(cy.pan(), cy.zoom()));
    };
    updateState();
    startLevel(newLevelContext);
    cy.on("zoom pan viewport", updateState);

    return () => {
      newLevelContext.destroy();
      cy.off("zoom pan viewport", updateState);
    };
  }, [level]);

  return (
    <PanZoomContext value={panZoom}>
      <div className="container">
        {levelContext !== null && <LevelSidebar levelContext={levelContext} />}

        <main className="canvas-container">
          <div
            id="cy"
            onDragOver={handleDragOver}
            onDrop={(e: React.DragEvent<HTMLDivElement>) =>
              handleDrop(levelContext, e)
            }
          >
            {levelContext !== null && (
              <>
                <EdgeConditionOverlay cy={levelContext.editorContext.cy} />
                <ConstantNodeOverlay cy={levelContext.editorContext.cy} />
              </>
            )}
          </div>
        </main>

        {levelContext !== null && (
          <aside className="controls-panel" id="controlsPanel">
            <AnimationControls levelContext={levelContext} />
            <SaveLoadControls context={levelContext} />
          </aside>
        )}
      </div>
    </PanZoomContext>
  );
}
