import { XYPosition } from "@xyflow/react";
import { createContext } from "react";
import { CallbackDict } from "../callback_dict";

export type EdgePathInfo = {
  edgePathHandlers: CallbackDict<string, string>;
  edgeCenterHandlers: CallbackDict<string, XYPosition>;
};

export const EdgePathContext = createContext<EdgePathInfo>(
  null as unknown as EdgePathInfo
);
