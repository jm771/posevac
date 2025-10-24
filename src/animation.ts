import { LevelContext } from "./editor_context";
import { Evaluator } from "./evaluation";

export function stepForward(levelContext: LevelContext) {
  if (levelContext.evaluator == null) {
    levelContext.evaluator = new Evaluator(
      levelContext.editorContext.allNodes,
      levelContext.evaluationListenerHolder
    );
  }

  levelContext.evaluator.stride();
}

export function resetAnimation(levelContext: LevelContext): void {
  levelContext.evaluator?.destroy();
  levelContext.evaluator = null;
}
