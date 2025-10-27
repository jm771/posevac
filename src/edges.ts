import { Condition } from "./condition";

export type EdgeData = {
  source: string;
  target: string;
  condition: Condition;
};
