import Flow, { Node } from "@xyflow/react";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { useParams } from "react-router";
import { AnimationControls } from "../components/AnimationControls";
import { FlowContainer } from "../components/FlowContainer";
import { GraphProvider } from "../components/GraphProvider";
import { ProgramCounterOverlay } from "../components/ProgramCounterOverlay";
import { SaveLoadControls } from "../components/SaveLoadControls";
import { LevelSidebar } from "../components/Sidebar";
import { TestCasePanel } from "../components/TestCasePanel";
import { LevelContext } from "../editor_context";
import { getLevelById } from "../levels";
import { NodeDefinition } from "../node_definitions";
import { PanZoomContext, PanZoomState } from "../rendered_position";

export function LevelPage() {
  const { levelId } = useParams<{ levelId: string }>();
  if (levelId === undefined) {
    throw Error("missing level id");
  }

  const level = useMemo(() => getLevelById(levelId), [levelId]);
  // const levelContextRef = useRef(new LevelContext());
  // This is maybe dubious?
  const [levelContext] = useState<LevelContext>(new LevelContext(level));

  const [panZoom, setPanZoom] = useState<PanZoomState>(new PanZoomState());
  const [draggedNode, setDraggedNode] = useState<Node<NodeDefinition> | null>(null);
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null);
  const sidebarRef = useRef<HTMLElement>(null);

  const handleNodeDrag = useCallback(
    (event: React.MouseEvent, node: Flow.Node<Record<string, unknown>>) => {
      setDraggedNode(node as Node<NodeDefinition>);
      setDragPosition({ x: event.clientX, y: event.clientY });
    },
    []
  );

  const handleNodeDragStop = useCallback(
    (_event: React.MouseEvent, _node: Flow.Node<Record<string, unknown>>) => {
      setDraggedNode(null);
      setDragPosition(null);
    },
    []
  );

  return (
    // <LevelContextContext value={levelContext}>
    <PanZoomContext value={panZoom}>
      <GraphProvider level={level} testValuesContext={levelContext}>
        <div className="container">
          <LevelSidebar
            level={level}
            draggedNode={draggedNode}
            dragPosition={dragPosition}
            ref={sidebarRef}
          />
          <div className="level-page-main">
            <div className="flow-ui-wrapper">
              <FlowContainer
                onNodeDrag={handleNodeDrag}
                onNodeDragStop={handleNodeDragStop}
              >
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
            <SaveLoadControls />
          </aside>
          <TestCasePanel
            level={level}
            testerEventSource={levelContext.testerListenerHolder}
          />
        </div>
      </GraphProvider>
    </PanZoomContext>
    // </LevelContextContext>
  );
}
