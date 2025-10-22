import { ComponentType } from "./nodes";

export interface Level {
  id: string;
  name: string;
  description: string;
  inputs: any[][]; // Array of arrays - each inner array represents inputs for one input node
  expectedOutputs: any[][]; // Array of arrays - expected outputs
  allowedNodes: ComponentType[];
}

export const LEVELS: Level[] = [
  {
    id: "addition",
    name: "Addition",
    description:
      "Learn the basics! Connect two numbers to a plus node to add them together.",
    inputs: [
      [3, 5, 7],
      [7, 8, 10],
    ],
    expectedOutputs: [[10, 13, 17]],
    allowedNodes: ["plus"],
  },
  {
    id: "cum-sum",
    name: "Cumulative Sum",
    description:
      "Learn basic looping and branching - compute the cumulative sum of some numbers",
    inputs: [[1, 2, 3, 4, 5]],
    expectedOutputs: [[1, 3, 6, 10, 15]],
    allowedNodes: ["plus", "constant"],
  },
  {
    id: "factorial",
    name: "Factorial",
    description:
      "Split and combine together with conditional branches let us compute factorial",
    inputs: [[4]],
    expectedOutputs: [[24]],
    allowedNodes: ["split", "combine", "constant", "multiply", "plus"],
  },
];

export function getLevelById(id: string): Level {
  const ret = LEVELS.find((level) => level.id === id);
  if (ret === undefined) {
    throw Error(`Level Id ${id} not found`);
  }
  return ret;
}
