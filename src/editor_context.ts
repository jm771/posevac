import Flow, { Node } from "@xyflow/react";
import { Dispatch, SetStateAction } from "react";
import { FlowNodeData } from "./components/FlowNodes";
import { Condition } from "./condition";
import { Evaluator } from "./evaluation";
import { EvaluationListenerHolder } from "./evaluation_listeners";
import { Level } from "./levels";
import { InputProvider, OutputChecker, TestValuesContext } from "./nodes";
import { Connection, TerminalType } from "./pos_flow";
import { Tester, TesterListenerHolder } from "./tester";
import { NotNull } from "./util";

function edgeMatches(e1: Flow.Edge, e2: Flow.Connection): boolean {
  return (
    e1.source === e2.source &&
    e1.sourceHandle === e2.sourceHandle &&
    e1.target === e2.target &&
    e1.targetHandle === e2.targetHandle
  );
}

// export class GraphEditorContext {
//   public level: Level;
//   posFlow: PosFlo;
//   testValuesContext: TestValuesContext;
//   setNodes: Dispatch<SetStateAction<Node<FlowNodeData>[]>>;
//   setEdges: Dispatch<SetStateAction<Flow.Edge[]>>;

//   constructor(
//     level: Level,
//     testValuesContext: TestValuesContext,
//     setNodes: Dispatch<SetStateAction<Node<FlowNodeData>[]>>,
//     setEdges: Dispatch<SetStateAction<Flow.Edge[]>>
//   ) {
//     this.level = level;
//     this.testValuesContext = testValuesContext;
//     this.posFlow = new PosFlo();
//     this.setNodes = setNodes;
//     this.setEdges = setEdges;
//   }

//   AddInputOutputNodes() {
//     range(nInputs(this.level)).forEach((idx) =>
//       this.posFlow.AddNode(MakeInputNode(idx, this.testValuesContext))
//     );

//     range(nOutputs(this.level)).forEach((idx) =>
//       this.posFlow.AddNode(MakeOutputNode(idx, this.testValuesContext))
//     );
//   }

//   AddConnection(flowCon: Flow.Connection) {
//     const connection = convertConnection(flowCon);
//     this.posFlow.AddConnection(connection);
//     this.setEdges((eds) => addEdge(flowCon, eds));
//   }

//   RemoveConnection(flowCon: Flow.Connection) {
//     const connection = convertConnection(flowCon);
//     this.posFlow.RemoveConnection(connection);
//     this.setEdges((eds) => eds.filter((e) => !edgeMatches(e, flowCon)));
//   }

//   AddNode(componentType: RegularComponentType, position: XYPosition) {
//     const compNode = this.posFlow.AddNode(GetNodeDefinition(componentType));

//     this.setNodes((nds) => [
//       ...nds,
//       {
//         id: compNode.id,
//         type: compNode.definition.style.style,
//         position: position,
//         data: getFlowNodeDataFromDefintion(compNode.definition),
//       },
//     ]);
//   }

//   RemoveNode() {}
// }

// export class LevelContext implements TestValuesContext {
//   editorContext: GraphEditorContext;
//   evaluationListenerHolder: EvaluationListenerHolder;
//   testerListenerHolder: TesterListenerHolder;
//   tester: Tester | null;
//   evaluator: Evaluator | null;
//   constructor(
//     level: Level,
//     setNodes: Dispatch<SetStateAction<Node<FlowNodeData>[]>>,
//     setEdges: Dispatch<SetStateAction<Flow.Edge[]>>
//   ) {
//     this.editorContext = new GraphEditorContext(
//       level,
//       this,
//       setNodes,
//       setEdges
//     );
//     this.evaluationListenerHolder = new EvaluationListenerHolder();
//     this.evaluator = null;
//     this.testerListenerHolder = new TesterListenerHolder();
//     this.tester = null;

//     const lc = this;

//     // TODO suuuuper unsure this is the right approach.
//     this.testerListenerHolder.registerListener({
//       onInputProduced: function (_inputId: number, _index: number): void {},
//       onExpectedOutput: function (_outputId: number, _index: number): void {},
//       onUnexpectedOutput: function (
//         _testCaseIndex: number,
//         _expected: unknown,
//         _actual: unknown,
//         _outputId: number,
//         _ndex: number
//       ): void {},
//       onTestPassed: function (_index: number): void {
//         lc.evaluator = null;
//       },
//       onAllTestsPassed: function (): void {},
//       onTestCaseStart: function (_testCaseIndex: number): void {},
//     });
//   }
//   getInputProvider(): InputProvider {
//     return NotNull(this.tester);
//   }
//   getOutputChecker(): OutputChecker {
//     return NotNull(this.tester);
//   }

//   destroy(): void {
//     this.evaluator?.destroy();
//   }
// }
