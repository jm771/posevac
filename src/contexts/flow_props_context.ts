import Flow from "@xyflow/react";
import { createContext } from "react";
import { NodeDefinition } from "../node_definitions";
import { Connection } from "../pos_flow";

type FlowProps = {
  nodes: Flow.Node<NodeDefinition>[];
  edges: Flow.Edge<Connection>[];
  onNodesChange: Flow.OnNodesChange<Flow.Node<NodeDefinition>>;
  onEdgesChange: Flow.OnEdgesChange<Flow.Edge<Connection>>;
};

export const FlowPropsContext = createContext<FlowProps>(
  null as unknown as FlowProps
);
