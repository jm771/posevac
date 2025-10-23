import React, { useEffect, useState } from "react";
import { getLevelById } from "../levels";
import { useParams } from "react-router";
import { startLevel } from "../app";
import { LevelSidebar } from "../components/Sidebar";
import { AnimationControls } from "../components/AnimationControls";
import { SaveLoadControls } from "../components/SaveLoadControls";
import { GraphEditorContext, LevelContext } from "../editor_context";
import { createConstantControls } from "../constant_controls";
import { ComponentType, createNodeFromName } from "../nodes";
import { EdgeConditionOverlay } from "../components/EdgeConditionOverlay";
import { PanZoomState } from "../rendered_position";

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

  console.log(
    `Adding new node with id ${newNode.getNodeId()} to context id ${context.id}`
  );
  context.allNodes.push(newNode);

  console.log(context.allNodes.map((x) => x.getNodeId()));

  // Create controls for constant nodes
  // TODO: This seems silly
  if (componentType === "constant") {
    createConstantControls(newNode.node, context.cy);
  }
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
    const updateState = () => {
      setPanZoom(new PanZoomState(cy.pan(), cy.zoom()));
    };
    updateState();
    startLevel(newLevelContext);
    cy.on("zoom pan viewport", updateState);

    return () => newLevelContext.destroy();
  }, [level]);

  return (
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
            <EdgeConditionOverlay
              cy={levelContext.editorContext.cy}
              panZoom={panZoom}
            />
          )}
        </div>
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
