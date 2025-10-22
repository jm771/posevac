import React, { useEffect, useState } from "react";
import { ComponentType, getLevelById } from "../levels";
import { useParams } from "react-router";
import { startLevel } from "../app";
import { COMPONENT_REGISTRY, createNode, EditorSidebar } from "../components/Sidebar";
import { AnimationControls } from "../components/AnimationControls";
import { SaveLoadControls } from "../components/SaveLoadControls";
import { GraphEditorContext, LevelContext } from "../editor_context";
import { createConstantControls } from "../constant_controls";

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
    <div className="container">
      {levelContext !== null && (
        <aside className="sidebar" id="sidebar">
          <div className="level-info">
            <h2 id="levelName">{level.name}</h2>
            <p id="levelDescription">{level.description}</p>
          </div>
          <h3>Components</h3>
          <EditorSidebar levelContext={levelContext} />
          <div className="delete-zone" id="deleteZone">
            <span>Drop here to delete</span>
          </div>
        </aside>
      )}

      <main className="canvas-container">
        <div id="cy"
              onDragOver={(e: React.DragEvent<HTMLDivElement>) => {
                console.log("drag over");
                e.preventDefault();
                // if (e.dataTransfer) {
                e.dataTransfer.dropEffect = "copy";
                // }
              }}
        
              onDrop={(e: React.DragEvent<HTMLDivElement>) => {
                console.log("drop start");
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
        
                context.allNodes.push(createNode(context, modelX, modelY));
                const component = COMPONENT_REGISTRY.find(
                  (c) => c.type === componentType
                );
                if (component) {
                  const newNode = component.createFunc(context, modelX, modelY);
                  context.allNodes.push(newNode);
        
                  // Create controls for constant nodes
                  // TODO: This seems silly
                  if (componentType === "constant") {
                    createConstantControls(newNode.node, context.cy);
                  }
                }
              }}
        
        ></div>
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
