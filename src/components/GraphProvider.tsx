import Flow, {
  Edge,
  Node,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  XYPosition,
} from "@xyflow/react";
import React, { useRef } from "react";
import { EdgesContext } from "../contexts/edges_context";
import { FlowPropsContext } from "../contexts/flow_props_context";
import {
  GraphEditor,
  GraphEditorContext,
} from "../contexts/graph_editor_context";
import {
  NodeCallbackContext,
  NodeCallbacks,
} from "../contexts/node_callbacks_context";
import { NodeContext } from "../contexts/nodes_context";
import { PosFloContext } from "../contexts/pos_flo_context";
import { MakeInputNode, MakeOutputNode } from "../input_output_nodes";
import { Level, nInputs, nOutputs } from "../levels";
import { NodeDefinition, NodeStyle } from "../node_definitions";
import { TestValuesContext } from "../nodes";
import { Connection, PosFlo } from "../pos_flow";
import { range } from "../util";

function MakeNodeFromDefn(
  ref: { current: number },
  defn: NodeDefinition,
  position: XYPosition
) {
  return {
    id: `node-${ref.current++}`,
    type: defn.style.style === NodeStyle.Constant ? "constant" : "compound",
    position: position,
    data: defn,
  };
}

function MakeInputOutputNodes(
  ref: { current: number },
  level: Level,
  testValuesContext: TestValuesContext
): Flow.Node<NodeDefinition>[] {
  const ret: Flow.Node<NodeDefinition>[] = [];

  range(nInputs(level)).forEach((idx) =>
    ret.push(
      MakeNodeFromDefn(ref, MakeInputNode(idx, testValuesContext), {
        x: 100,
        y: 100 * idx,
      })
    )
  );

  range(nOutputs(level)).forEach((idx) =>
    ret.push(
      MakeNodeFromDefn(ref, MakeOutputNode(idx, testValuesContext), {
        x: 300,
        y: 100 * idx,
      })
    )
  );

  return ret;
}

export function GraphProvider({
  children,
  level,
  testValuesContext,
}: {
  children: React.JSX.Element;
  level: Level;
  testValuesContext: TestValuesContext;
}) {
  const nodeCallbackRef = useRef<NodeCallbacks>(new NodeCallbacks());

  const nodeId = useRef<number>(0);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<NodeDefinition>>(
    MakeInputOutputNodes(nodeId, level, testValuesContext)
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge<Connection>>([]);

  const flowProps = { nodes, edges, onNodesChange, onEdgesChange };

  return (
    <ReactFlowProvider>
      <NodeCallbackContext value={nodeCallbackRef.current}>
        <EdgesContext value={edges}>
          <NodeContext value={nodes}>
            <PosFloContext value={new PosFlo(nodes, edges)}>
              <GraphEditorContext
                value={new GraphEditor(nodeId, setNodes, setEdges)}
              >
                <FlowPropsContext value={flowProps}>
                  {children}
                </FlowPropsContext>
              </GraphEditorContext>
            </PosFloContext>
          </NodeContext>
        </EdgesContext>
      </NodeCallbackContext>
    </ReactFlowProvider>
  );
}
