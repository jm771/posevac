import { createContext } from "react";
import { CallbackDict } from "../callback_dict";

export const EdgePathContext = createContext<CallbackDict<string, string>>(
  null as unknown as CallbackDict<string, string>
);
