import { LevelContext } from "./editor_context";
import { Evaluator } from "./evaluation";
import { Tester } from "./tester";

export function stepForward(levelContext: LevelContext) {
  if (levelContext.tester == null) {
    levelContext.tester = new Tester(
      levelContext.editorContext.level.testCases,
      levelContext.testerListenerHolder
    );
  }

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
  levelContext.tester = null;
  levelContext.evaluator = null;
}
