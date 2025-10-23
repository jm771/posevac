import { setupEdgeCreation } from "./edge_creation";
import { LevelContext } from "./editor_context";
// import { initializeConstantControls } from "./constant_controls";

export function startLevel(levelContext: LevelContext): LevelContext {
  setupEdgeCreation(levelContext);

  return levelContext;
}
