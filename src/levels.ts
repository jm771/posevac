import { ComponentType } from "./nodes";

export type TestCase = {
  inputs: unknown[][]; // Array of arrays - each inner array represents inputs for one input node
  expectedOutputs: unknown[][]; // Array of arrays - expected outputs
};

export interface Level {
  id: string;
  name: string;
  description: string;
  testCases: TestCase[];
  allowedNodes: ComponentType[];
}

const ADDITION: Level = {
  id: "addition",
  name: "Addition",
  description:
    "Learn the basics! Connect two numbers to a plus node to add them together.",
  testCases: [
    {
      inputs: [
        [3, 5, 7],
        [7, 8, 10],
      ],
      expectedOutputs: [[10, 13, 17]],
    },
    {
      inputs: [
        [1, 3, 5],
        [2, 4, 6],
      ],
      expectedOutputs: [[3, 7, 11]],
    },
  ],
  allowedNodes: ["plus"],
};

const CUM_SUM: Level = {
  id: "cum-sum",
  name: "Cumulative Sum",
  description:
    "Learn basic looping and branching - compute the cumulative sum of some numbers",
  testCases: [
    {
      inputs: [[1, 2, 3, 4, 5]],
      expectedOutputs: [[1, 3, 6, 10, 15]],
    },
  ],
  allowedNodes: ["plus", "constant"],
};

const MULTIPLY: Level = {
  id: "multiply",
  name: "Multiply",
  description: "Build the multiply component - multiply two non-negative integers",
  testCases: [
    {
      inputs: [[4], [2]],
      expectedOutputs: [[8]],
    },
    {
      inputs: [[5], [3]],
      expectedOutputs: [[15]],
    },
  ],
  allowedNodes: ["split", "combine", "constant", "plus"],
};

const FACTORIAL: Level = {
  id: "factorial",
  name: "Factorial",
  description:
    "Split and combine together with conditional branches let us compute factorial",
  testCases: [
    {
      inputs: [[4]],
      expectedOutputs: [[24]],
    },
  ],
  allowedNodes: ["split", "combine", "constant", "multiply", "plus"],
};

const LESS_THAN_FOUR: Level = {
  id: "lt",
  name: "Less Than Four",
  description: "Filter the input to only output those that are less than four (inputs will be non negative integers)",
  testCases: [
    {
      inputs: [[1, 2, 3, 4, 5, 1]],
      expectedOutputs: [[1, 2, 3, 1]],
    },
    {
      inputs: [[4, 3, 4]],
      expectedOutputs: [[3]],
    },
  ],
  allowedNodes: ["split", "combine", "constant", "multiply", "plus", "nop"],
};

const MAX: Level = {
  id: "max",
  name: "Maximum",
  description: "Work out the maxium of two numbers - how hard can it be? (inputs will be non negative integers)",
  testCases: [
    {
      inputs: [[1], [2]],
      expectedOutputs: [[2]],
    },
    {
      inputs: [[0], [1]],
      expectedOutputs: [[1]],
    },
    {
      inputs: [
        [2],
        [4],
      ],
      expectedOutputs: [[4]],
    },
  ],
  allowedNodes: ["split", "combine", "constant", "multiply", "plus", "nop"],
};

export const LEVELS: Level[] = [
  ADDITION,
  CUM_SUM,
  FACTORIAL,
  MULTIPLY,
  LESS_THAN_FOUR,
  MAX,
];

export function getLevelById(id: string): Level {
  const ret = LEVELS.find((level) => level.id === id);
  if (ret === undefined) {
    throw Error(`Level Id ${id} not found`);
  }
  return ret;
}
