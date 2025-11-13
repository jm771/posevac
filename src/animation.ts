import { LevelContext } from "./editor_context";
import { Evaluator } from "./evaluation";
import { NodeId } from "./nodes";
import { PosFlo } from "./pos_flow";
import { Tester } from "./tester";

export function stepForward(levelContext: LevelContext, posFlo: PosFlo) {
  if (levelContext.tester === null) {
    levelContext.tester = new Tester(
      levelContext.level.testCases,
      levelContext.testerListenerHolder
    );
  }

  // TODO need to plumb real settings in

  if (levelContext.evaluator == null) {
    levelContext.evaluator = new Evaluator(
      posFlo,
      levelContext.evaluationListenerHolder,
      new Map<NodeId, unknown>()
    );
  }

  levelContext.evaluator.stride();
}

export function resetAnimation(levelContext: LevelContext): void {
  levelContext.evaluator?.destroy();
  levelContext.tester = null;
  levelContext.evaluator = null;
}
