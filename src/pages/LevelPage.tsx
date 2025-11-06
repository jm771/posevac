import React, { useMemo, useState } from "react";
import { useParams } from "react-router";
import { AnimationControls } from "../components/AnimationControls";
import { FlowContainerWrapper } from "../components/FlowContainer";
import { ProgramCounterOverlay } from "../components/ProgramCounterOverlay";
import { SaveLoadControls } from "../components/SaveLoadControls";
import { LevelSidebar } from "../components/Sidebar";
import { TestCasePanel } from "../components/TestCasePanel";
import { LevelContext } from "../editor_context";
import { getLevelById } from "../levels";
import { PanZoomContext, PanZoomState } from "../rendered_position";

export function LevelPage() {
  const { levelId } = useParams<{ levelId: string }>();
  if (levelId === undefined) {
    throw Error("missing level id");
  }

  const levelContext = useMemo(
    () => new LevelContext(getLevelById(levelId)),
    [levelId]
  );

  const [panZoom, setPanZoom] = useState<PanZoomState>(new PanZoomState());

  const handleViewportChange = (newPanZoom: PanZoomState) => {
    setPanZoom(newPanZoom);
  };

  return (
    <PanZoomContext value={panZoom}>
      <div className="container">
        <LevelSidebar levelContext={levelContext} />
        <div className="level-page-main">
          <div className="flow-ui-wrapper">
            <FlowContainerWrapper
              levelContext={levelContext}
              onViewportChange={handleViewportChange}
            >
              <>
                {/* <EdgeConditionOverlay cy={levelContext.editorContext.cy} /> */}
                {/* <ConstantNodeOverlay cy={levelContext.editorContext.cy} /> */}
                <ProgramCounterOverlay
                  evaluationEventSource={levelContext.evaluationListenerHolder}
                />
              </>
            </FlowContainerWrapper>
          </div>
        </div>
        <aside className="controls-panel" id="controlsPanel">
          <AnimationControls levelContext={levelContext} />
          <SaveLoadControls context={levelContext} />
        </aside>
        <TestCasePanel levelContext={levelContext} />
      </div>
    </PanZoomContext>
  );
}
