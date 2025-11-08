import React, { useMemo, useState } from "react";
import { useParams } from "react-router";
import { AnimationControls } from "../components/AnimationControls";
import { FlowContainer } from "../components/FlowContainer";
import { GraphProvider } from "../components/GraphProvider";
import { ProgramCounterOverlay } from "../components/ProgramCounterOverlay";
import { SaveLoadControls } from "../components/SaveLoadControls";
import { LevelSidebar } from "../components/Sidebar";
import { TestCasePanel } from "../components/TestCasePanel";
import { getLevelById } from "../levels";
import { PanZoomContext, PanZoomState } from "../rendered_position";

export function LevelPage() {
  const { levelId } = useParams<{ levelId: string }>();
  if (levelId === undefined) {
    throw Error("missing level id");
  }

  const level = useMemo(() => getLevelById(levelId), [levelId]);

  const [panZoom, setPanZoom] = useState<PanZoomState>(new PanZoomState());
  const testValuesContext = "TODO";

  // const handleViewportChange = (newPanZoom: PanZoomState) => {
  //   setPanZoom(newPanZoom);
  // };

  return (
    <PanZoomContext value={panZoom}>
      <GraphProvider level={level} testValuesContext={testValuesContext}>
        <div className="container">
          <LevelSidebar levelContext={levelContext} />
          <div className="level-page-main">
            <div className="flow-ui-wrapper">
              <FlowContainer>
                <>
                  {/* <EdgeConditionOverlay cy={levelContext.editorContext.cy} /> */}
                  {/* <ConstantNodeOverlay cy={levelContext.editorContext.cy} /> */}
                  <ProgramCounterOverlay
                    evaluationEventSource={
                      levelContext.evaluationListenerHolder
                    }
                  />
                </>
              </FlowContainer>
            </div>
          </div>
          <aside className="controls-panel" id="controlsPanel">
            <AnimationControls levelContext={levelContext} />
            <SaveLoadControls context={levelContext} />
          </aside>
          <TestCasePanel levelContext={levelContext} />
        </div>
      </GraphProvider>
    </PanZoomContext>
  );
}
