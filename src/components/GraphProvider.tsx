import React, { createContext, SetStateAction, useState } from "react";
import Flow, { addEdge, Node, XYPosition } from "@xyflow/react";
import { PosFlo } from "../pos_flow";
import { range } from "../util";
import { Level, nInputs, nOutputs } from "../levels";
import { MakeInputNode, MakeOutputNode } from "../input_output_nodes";
import { NodeDefinition } from "../node_definitions";


export function convertConnection(connection: Flow.Connection): Connection {
  const sourceHandleIdx = parseInt(
    NotNull(connection.sourceHandle).replace("output-", "")
  );
  const targetHandleIdx = parseInt(
    NotNull(connection.targetHandle?.replace("input-", ""))
  );

  return {
    source: {
      type: TerminalType.Output,
      nodeId: NotNull(connection.source),
      terminalIndex: sourceHandleIdx,
    },
    dest: {
      type: TerminalType.Input,
      nodeId: NotNull(connection.target),
      terminalIndex: targetHandleIdx,
    },
    condition: new Condition([]),
  };
}

function edgeMatches(e1: Flow.Edge, e2: Flow.Connection): boolean {
  return (
    e1.source === e2.source &&
    e1.sourceHandle === e2.sourceHandle &&
    e1.target === e2.target &&
    e1.targetHandle === e2.targetHandle
  );
}

function MakeInputOutputNodes(level: Level) : Flow.Node<NodeDefinition> {

    
    range(nInputs(level)).forEach((idx) =>
      this.posFlow.AddNode(MakeInputNode(idx, this.testValuesContext))
    );

    range(nOutputs(level)).forEach((idx) =>
      this.posFlow.AddNode(MakeOutputNode(idx, this.testValuesContext))
    );
  }

function MakeNodeFromDefn(id: string, defn: NodeDefinition, position: XYPosition)
{
    return {
        id: id,
        type: defn.style.style,
        position: position,
        data: defn,
      }
}

 function MakeNode(componentType: RegularComponentType, position: XYPosition) {
    const compNode = this.posFlow.AddNode(GetNodeDefinition(componentType));

    this.setNodes((nds) => [
      ...nds,
      
    ]);
  }

export class GraphEditorContext {
  public level: Level;
//   posFlow: PosFlo;
  testValuesContext: TestValuesContext;

  constructor(
    level: Level,
    testValuesContext: TestValuesContext,
    setNodes: Dispatch<SetStateAction<Node<FlowNodeData>[]>>,
    setEdges: Dispatch<SetStateAction<Flow.Edge[]>>
  ) {
    this.level = level;
    this.testValuesContext = testValuesContext;
    this.posFlow = new PosFlo();
    this.setNodes = setNodes;
    this.setEdges = setEdges;
  }



  AddConnection(flowCon: Flow.Connection) {
    const connection = convertConnection(flowCon);
    this.posFlow.AddConnection(connection);
    this.setEdges((eds) => addEdge(flowCon, eds));
  }

  RemoveConnection(flowCon: Flow.Connection) {
    const connection = convertConnection(flowCon);
    this.posFlow.RemoveConnection(connection);
    this.setEdges((eds) => eds.filter((e) => !edgeMatches(e, flowCon)));
  }

  AddNode(componentType: RegularComponentType, position: XYPosition) {
    const compNode = this.posFlow.AddNode(GetNodeDefinition(componentType));

    this.setNodes((nds) => [
      ...nds,
      {
        id: compNode.id,
        type: compNode.definition.style.style,
        position: position,
        data: getFlowNodeDataFromDefintion(compNode.definition),
      },
    ]);
  }

  RemoveNode() {}
}


interface PosFlowBuilder {
      AddInputOutputNodes() {
        range(nInputs(this.level)).forEach((idx) =>
          this.posFlow.AddNode(MakeInputNode(idx, this.testValuesContext))
        );
    
        range(nOutputs(this.level)).forEach((idx) =>
          this.posFlow.AddNode(MakeOutputNode(idx, this.testValuesContext))
        );
      }
    
      AddConnection(flowCon: Flow.Connection) {
        const connection = convertConnection(flowCon);
        this.posFlow.AddConnection(connection);
        this.setEdges((eds) => addEdge(flowCon, eds));
      }
    
      RemoveConnection(flowCon: Flow.Connection) {
        const connection = convertConnection(flowCon);
        this.posFlow.RemoveConnection(connection);
        this.setEdges((eds) => eds.filter((e) => !edgeMatches(e, flowCon)));
      }
    
      AddNode(componentType: RegularComponentType, position: XYPosition) {
        const compNode = this.posFlow.AddNode(GetNodeDefinition(componentType));
    
        this.setNodes((nds) => [
          ...nds,
          {
            id: compNode.id,
            type: compNode.definition.style.style,
            position: position,
            data: getFlowNodeDataFromDefintion(compNode.definition),
          },
        ]);
      }
    
      RemoveNode() {}
}

class PosFloInfo {

}

class PosFlow {
      AddInputOutputNodes() {
        range(nInputs(this.level)).forEach((idx) =>
          this.posFlow.AddNode(MakeInputNode(idx, this.testValuesContext))
        );
    
        range(nOutputs(this.level)).forEach((idx) =>
          this.posFlow.AddNode(MakeOutputNode(idx, this.testValuesContext))
        );
      }
    
      AddConnection(flowCon: Flow.Connection) {
        const connection = convertConnection(flowCon);
        this.posFlow.AddConnection(connection);
        this.setEdges((eds) => addEdge(flowCon, eds));
      }
    
      RemoveConnection(flowCon: Flow.Connection) {
        const connection = convertConnection(flowCon);
        this.posFlow.RemoveConnection(connection);
        this.setEdges((eds) => eds.filter((e) => !edgeMatches(e, flowCon)));
      }
    
      AddNode(componentType: RegularComponentType, position: XYPosition) {
        const compNode = this.posFlow.AddNode(GetNodeDefinition(componentType));
    
        this.setNodes((nds) => [
          ...nds,
          {
            id: compNode.id,
            type: compNode.definition.style.style,
            position: position,
            data: getFlowNodeDataFromDefintion(compNode.definition),
          },
        ]);
      }
    
      RemoveNode() {}
}

export const PosFloContext = createContext<PosFloManip>(null as unknown as PosFloManip);


export function PosFloProvider({children} : {children: React.JSX.Element;}) {
    const [posFlo, setPosFlo] = useState<PosFlo>(new PosFlo());
    
    return <PosFloContext value = {{posFlo, setPosFlo}}> 
    {children}
    </PosFloContext>
}


