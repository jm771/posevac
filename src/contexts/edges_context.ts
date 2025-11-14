import { Edge } from "@xyflow/react";
import { createContext } from "react";
import { Connection } from "../pos_flow";

export const EdgesContext = createContext<Edge<Connection>[]>([]);
