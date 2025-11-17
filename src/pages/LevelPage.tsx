import React, { useMemo, useState } from "react";
import { useParams } from "react-router";
import { AnimationControls } from "../components/AnimationControls";
import { EdgeConditionOverlay } from "../components/EdgeConditionOverlay";
import { FlowContainer } from "../components/FlowContainer";
import { GraphProvider } from "../components/GraphProvider";
import { ProgramCounterOverlay } from "../components/ProgramCounterOverlay";
import { SaveLoadControls } from "../components/SaveLoadControls";
import { LevelSidebar } from "../components/Sidebar";
import { TestCasePanel } from "../components/TestCasePanel";
import { LevelContext } from "../editor_context";
import { SerializedGraph } from "../graph_serialization";
import { getLevelById } from "../levels";

export function LevelPage() {
  const { levelId } = useParams<{ levelId: string }>();

  const [saveState, setSaveState] = useState<SerializedGraph | null>(null);
  const [editorKey, setEditorKey] = useState<number>(0);

  if (levelId === undefined) {
    throw Error("missing level id");
  }

  const level = useMemo(() => getLevelById(levelId), [levelId]);
  // const levelContextRef = useRef(new LevelContext());
  // This is maybe dubious?
  const [levelContext] = useState<LevelContext>(new LevelContext(level));

  return (
    <GraphProvider level={level} key={editorKey} saveState={saveState}>
      <div className="container">
        <LevelSidebar level={level} />
        <div className="level-page-main">
          <div className="flow-ui-wrapper">
            <FlowContainer>
              <>
                <EdgeConditionOverlay />
                <ProgramCounterOverlay
                  evaluationEventSource={levelContext.evaluationListenerHolder}
                />
              </>
            </FlowContainer>
          </div>
        </div>
        <aside className="controls-panel" id="controlsPanel">
          <AnimationControls levelContext={levelContext} />
          <SaveLoadControls
            levelId={level.id}
            setSaveState={(k: SerializedGraph) => {
              setSaveState(k);
              setEditorKey((x) => x + 1);
            }}
          />
        </aside>
        <TestCasePanel
          level={level}
          testerEventSource={levelContext.testerListenerHolder}
        />
      </div>
    </GraphProvider>
  );
}
