import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import { AnimationControls } from "../components/AnimationControls";
import {
  ConstantNodeOverlay,
  initializeNodeLabelStyling,
} from "../components/ConstantNodeOverlay";
import { FlowContainerWrapper } from "../components/FlowContainer";
import { EdgeConditionOverlay } from "../components/EdgeConditionOverlay";
import { ProgramCounterOverlay } from "../components/ProgramCounterOverlay";
import { SaveLoadControls } from "../components/SaveLoadControls";
import { LevelSidebar } from "../components/Sidebar";
import { TestCasePanel } from "../components/TestCasePanel";
import { LevelContext } from "../editor_context";
import { getLevelById } from "../levels";
import { PanZoomContext, PanZoomState } from "../rendered_position";
import { NotNull } from "../util";

export function LevelPage() {
  const { levelId } = useParams<{ levelId: string }>();
  if (levelId === undefined) {
    throw Error("missing level id");
  }

  const level = getLevelById(levelId);
  const [levelContext, setLevelContext] = useState<LevelContext | null>(null);
  const [panZoom, setPanZoom] = useState<PanZoomState>(new PanZoomState());

  useEffect(() => {
    const newLevelContext = new LevelContext(level);

    setLevelContext(newLevelContext);

    const cy = newLevelContext.editorContext.cy;
    initializeNodeLabelStyling(cy);

    return () => {
      newLevelContext.destroy();
    };
  }, [level]);

  const handleViewportChange = (newPanZoom: PanZoomState) => {
    setPanZoom(newPanZoom);
  };

  return (
    <PanZoomContext value={panZoom}>
      <div className="container">
        {levelContext !== null && <LevelSidebar levelContext={levelContext} />}
        <div className="level-page-main">
          <div className="flow-ui-wrapper">
            <FlowContainerWrapper
              levelContext={levelContext}
              onViewportChange={handleViewportChange}
            >
              <>
                {levelContext !== null && (
                  <>
                    <EdgeConditionOverlay cy={levelContext.editorContext.cy} />
                    <ConstantNodeOverlay cy={levelContext.editorContext.cy} />
                    <ProgramCounterOverlay
                      evaluationEventSource={
                        levelContext.evaluationListenerHolder
                      }
                    />
                  </>
                )}
              </>
            </FlowContainerWrapper>
          </div>
        </div>

        {levelContext !== null && (
          <>
            <aside className="controls-panel" id="controlsPanel">
              <AnimationControls levelContext={levelContext} />
              <SaveLoadControls context={levelContext} />
            </aside>
            <TestCasePanel levelContext={levelContext} />
          </>
        )}
      </div>
    </PanZoomContext>
  );
}
