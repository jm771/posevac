import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import { AnimationControls } from "../components/AnimationControls";
import {
  ConstantNodeOverlay,
  initializeNodeLabelStyling,
} from "../components/ConstantNodeOverlay";
import { CyContainer } from "../components/CyContainer";
import { EdgeConditionOverlay } from "../components/EdgeConditionOverlay";
import { ProgramCounterOverlay } from "../components/ProgramCounterOverlay";
import { SaveLoadControls } from "../components/SaveLoadControls";
import { LevelSidebar } from "../components/Sidebar";
import { GraphEditorContext, LevelContext } from "../editor_context";
import { getLevelById } from "../levels";
import { ComponentType, createNodeFromName } from "../nodes";
import { PanZoomContext, PanZoomState } from "../rendered_position";
import { NotNull } from "../util";

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
  const cyDivRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const newLevelContext = new LevelContext(
      new GraphEditorContext(level, NotNull(cyDivRef.current)),
      null
    );

    setLevelContext(newLevelContext);

    const cy = newLevelContext.editorContext.cy;
    initializeNodeLabelStyling(cy);

    const updateState = () => {
      setPanZoom(new PanZoomState(cy.pan(), cy.zoom()));
    };
    updateState();

    cy.on("zoom pan viewport", updateState);

    return () => {
      newLevelContext.destroy();
      // cy.off("zoom pan viewport", updateState);
    };
  }, [level]);

  return (
    <PanZoomContext value={panZoom}>
      <div className="container">
        {levelContext !== null && <LevelSidebar levelContext={levelContext} />}

        <CyContainer levelContext={levelContext}>
          <div
            ref={cyDivRef}
            className="cy-container"
            onDragOver={handleDragOver}
            onDrop={(e: React.DragEvent<HTMLDivElement>) =>
              handleDrop(levelContext, e)
            }
          >
            {levelContext !== null && (
              <>
                <EdgeConditionOverlay cy={levelContext.editorContext.cy} />
                <ConstantNodeOverlay cy={levelContext.editorContext.cy} />
                <ProgramCounterOverlay
                  evaluationEventSource={levelContext.evaluationListenerHolder}
                />
              </>
            )}
          </div>
        </CyContainer>

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
