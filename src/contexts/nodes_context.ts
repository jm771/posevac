import { Node } from "@xyflow/react";
import { createContext } from "react";
import { NodeDefinition } from "../node_definitions";

export const NodeContext = createContext<Node<NodeDefinition>[]>([]);
