// Graph Serialization - Save and load graph structures to/from JSON

import { Condition } from "./condition";
import { EcsComponent, EntityComponents } from "./contexts/ecs_context";
import { GraphEditor } from "./contexts/graph_editor_context";
import { NodeSetting } from "./contexts/node_settings_context";
import { ComponentType } from "./node_definitions";
import { Connection, PosFlo } from "./pos_flow";
import { Assert, getOrThrow, mapIterable, NotNull } from "./util";

const SERIALIZATION_VERSION = "1.0.2";

export interface SerializedNode {
  id: string;
  type: ComponentType;
  position: { x: number; y: number };
}

export type SerializedNodeSetting = {
  node_id: string;
  setting: NodeSetting;
};

export type SerializedComponent = {
  entityId: string;
  kind: EcsComponent;
  value: unknown;
};

export interface SerializedGraph {
  version: string;
  levelId: string;
  timestamp: string;
  nodes: SerializedNode[];
  edges: Connection[];
  nodeSettings: SerializedNodeSetting[];
  components: SerializedComponent[];
}

export function exportGraph(
  posFlo: PosFlo,
  levelId: string,
  ecs: EntityComponents
): SerializedGraph {
  // Get all user-created nodes (exclude input/output nodes and terminals)
  const nodes: SerializedNode[] = posFlo.nodes.map((node) => {
    return {
      id: node.id,
      type: node.data.componentType,
      position: node.position,
    };
  });

  const edges = posFlo.connections.map((x) => NotNull(x.data));
  const nodeSettings = mapIterable(
    posFlo.nodeSettings.entries(),
    ([node_id, setting]) => {
      return { node_id, setting };
    }
  );

  const componentVals: SerializedComponent[] = ecs
    .GetAllComponents()
    .filter(([[id, x], y]) => !id.includes("preview"))
    .map(([[entityId, kind], value]) => {
      return { entityId, kind, value };
    });

  return {
    version: SERIALIZATION_VERSION,
    levelId,
    timestamp: new Date().toISOString(),
    nodes,
    edges,
    nodeSettings,
    components: componentVals,
  };
}

export function importGraph(
  serializedGraph: SerializedGraph,
  levelId: string,
  editor: GraphEditor,
  ecs: EntityComponents
): void {
  Assert(
    serializedGraph.version === SERIALIZATION_VERSION,
    "Wrong serialization version"
  );

  Assert(
    serializedGraph.levelId === levelId,
    `Graph is for level "${serializedGraph.levelId}" but current level is "${levelId}"`
  );

  // TODO need to do edges too if want componenets for them
  const idMap = new Map<string, string>();

  for (const serializedNode of serializedGraph.nodes) {
    const newNode = editor.AddNode(
      serializedNode.type,
      serializedNode.position
    );
    idMap.set(serializedNode.id, newNode.id);
  }

  for (const serializedEdge of serializedGraph.edges) {
    editor.AddBusinessConnection({
      source: {
        ...serializedEdge.source,
        nodeId: getOrThrow(idMap, serializedEdge.source.nodeId),
      },
      dest: {
        ...serializedEdge.dest,
        nodeId: getOrThrow(idMap, serializedEdge.dest.nodeId),
      },
      condition: new Condition(serializedEdge.condition.matchers),
    });
  }

  for (const setting of serializedGraph.nodeSettings) {
    editor.settings.set(getOrThrow(idMap, setting.node_id), setting.setting);
  }

  for (const ecsComp of serializedGraph.components) {
    ecs.MakeComponent(
      getOrThrow(idMap, ecsComp.entityId),
      ecsComp.kind,
      ecsComp.value
    );
  }
}
