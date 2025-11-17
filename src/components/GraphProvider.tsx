import {
  Edge,
  Node,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  XYPosition,
} from "@xyflow/react";
import React, { SetStateAction, useMemo, useRef } from "react";
import { CallbackDict } from "../callback_dict";
import { EdgePathContext } from "../contexts/edge_path_context";
import { FlowPropsContext } from "../contexts/flow_props_context";
import {
  GraphEditor,
  GraphEditorContext,
} from "../contexts/graph_editor_context";
import {
  NodeCallbackContext,
  NodeCallbacks,
} from "../contexts/node_callbacks_context";
import {
  NodeSetting,
  NodeSettingsContext,
  NodeSettingType,
} from "../contexts/node_settings_context";
import { PosFloContext } from "../contexts/pos_flo_context";
import { importGraph, SerializedGraph } from "../graph_serialization";
import { Level, nInputs, nOutputs } from "../levels";
import { InputOutputComponentType, NodeDefinition } from "../node_definitions";
import { Connection, PosFlo } from "../pos_flow";
import { range } from "../util";

function MakeInputOutputNodes(level: Level, graphEditor: GraphEditor) {
  range(nInputs(level)).forEach((idx) => {
    const newNode = graphEditor.AddNode(InputOutputComponentType.Input, {
      x: -300,
      y: 200 * idx,
    });
    graphEditor.settings.set(newNode.id, {
      type: NodeSettingType.Input,
      setting: { index: idx },
    });
  });

  range(nOutputs(level)).forEach((idx) => {
    const newNode = graphEditor.AddNode(InputOutputComponentType.Output, {
      x: 300,
      y: 200 * idx,
    });

    graphEditor.settings.set(newNode.id, {
      type: NodeSettingType.Output,
      setting: { index: idx },
    });
  });
}

class InitialState {
  nodeId = { current: 0 };
  nodes: Node<NodeDefinition>[] = [];
  edges: Edge<Connection>[] = [];
  settings = new Map<string, NodeSetting>();
}

function loadInitialState(saveState: SerializedGraph | null, level: Level) {
  const state = new InitialState();

  function setEdges(value: SetStateAction<Edge<Connection>[]>) {
    if (typeof value === "function") {
      // functional update
      state.edges = (value as (prev: Edge<Connection>[]) => Edge<Connection>[])(
        state.edges
      );
    } else {
      // direct value
      state.edges = value;
    }
  }

  function setNodes(value: SetStateAction<Node<NodeDefinition>[]>) {
    if (typeof value === "function") {
      // functional update
      state.nodes = (
        value as (prev: Node<NodeDefinition>[]) => Node<NodeDefinition>[]
      )(state.nodes);
    } else {
      // direct value
      state.nodes = value;
    }
  }

  const editor = new GraphEditor(
    state.nodeId,
    setNodes,
    setEdges,
    state.settings
  );

  if (saveState != null) {
    importGraph(saveState, level.id, editor);
  } else {
    MakeInputOutputNodes(level, editor);
  }

  return state;
}

export function GraphProvider({
  children,
  level,
  saveState,
}: {
  children: React.JSX.Element;
  level: Level;
  saveState: SerializedGraph | null;
}) {
  const initalState = useMemo(
    () => loadInitialState(saveState, level),
    [saveState, level]
  );

  const nodeCallbackRef = useRef<NodeCallbacks>(new NodeCallbacks());

  const nodeId = useRef<number>(initalState.nodeId.current);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<NodeDefinition>>(
    initalState.nodes
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge<Connection>>(
    initalState.edges
  );

  const flowProps = { nodes, edges, onNodesChange, onEdgesChange };

  const edgePathCallbackRef = useRef({
    edgePathHandlers: new CallbackDict<string, string>(),
    edgeCenterHandlers: new CallbackDict<string, XYPosition>(),
  });
  // TODO - should find some way to not rerender - but still need to update
  // const posfloRef = useRef(new PosFlo(nodes, edges));
  const settingsRef = useRef(initalState.settings);

  // This one too probably
  const graphEditor = useRef<GraphEditor>(
    new GraphEditor(nodeId, setNodes, setEdges, settingsRef.current)
  ).current;

  // const didInit = useRef(false);

  // useEffect(() => {
  //   if (didInit.current) return;

  //   if (!saveState) {
  //     MakeInputOutputNodes(level, graphEditor);
  //   } else {
  //     importGraph(saveState, level.id, graphEditor);
  //   }
  //   didInit.current = true;
  // }, [level, graphEditor, saveState]);

  return (
    <ReactFlowProvider>
      <NodeCallbackContext value={nodeCallbackRef.current}>
        <EdgePathContext value={edgePathCallbackRef.current}>
          <PosFloContext value={new PosFlo(nodes, edges, settingsRef.current)}>
            <NodeSettingsContext value={settingsRef.current}>
              <GraphEditorContext value={graphEditor}>
                <FlowPropsContext value={flowProps}>
                  {children}
                </FlowPropsContext>
              </GraphEditorContext>
            </NodeSettingsContext>
          </PosFloContext>
        </EdgePathContext>
      </NodeCallbackContext>
    </ReactFlowProvider>
  );
}
