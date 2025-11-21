import { EntityComponents } from "./contexts/ecs_context";
import { LevelContext } from "./editor_context";
import { OverclockedEvaluator } from "./overclocked_evaluation";
import { PosFlo } from "./pos_flow";
import { Tester } from "./tester";

export function stepForward(
  levelContext: LevelContext,
  posFlo: PosFlo,
  ecs: EntityComponents
) {
  if (levelContext.tester === null) {
    levelContext.tester = new Tester(
      levelContext.level.testCases,
      levelContext.testerListenerHolder
    );
  }

  // TODO need to plumb real settings in

  if (levelContext.evaluator == null) {
    levelContext.evaluator = new OverclockedEvaluator(
      posFlo,
      levelContext.evaluationListenerHolder,
      levelContext,
      ecs
    );
  }

  levelContext.evaluator.stride();
}

export function resetAnimation(levelContext: LevelContext): void {
  levelContext.evaluator?.destroy();
  levelContext.tester = null;
  levelContext.evaluator = null;
}
