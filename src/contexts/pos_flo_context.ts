import { createContext } from "react";
import { PosFlo } from "../pos_flow";

export const PosFloContext = createContext<PosFlo>(null as unknown as PosFlo);
