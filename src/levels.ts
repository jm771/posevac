import { RegularComponentType } from "./node_definitions";
import { Assert } from "./util";

export type TestCase = {
  inputs: unknown[][]; // Array of arrays - each inner array represents inputs for one input node
  expectedOutputs: unknown[][]; // Array of arrays - expected outputs
};

export interface Level {
  id: string;
  name: string;
  description: string;
  testCases: TestCase[];
  allowedNodes: RegularComponentType[];
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
  allowedNodes: [RegularComponentType.Plus],
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
  allowedNodes: [RegularComponentType.Plus, RegularComponentType.Constant],
};

const MULTIPLY: Level = {
  id: "multiply",
  name: "Multiply",
  description:
    "Build the multiply component - multiply two non-negative integers",
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
  allowedNodes: [
    RegularComponentType.Split,
    RegularComponentType.Combine,
    RegularComponentType.Constant,
    RegularComponentType.Plus,
  ],
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
  allowedNodes: [
    RegularComponentType.Split,
    RegularComponentType.Combine,
    RegularComponentType.Constant,
    RegularComponentType.Multiply,
    RegularComponentType.Plus,
  ],
};

const LESS_THAN_FOUR: Level = {
  id: "lt",
  name: "Less Than Four",
  description:
    "Filter the input to only output those that are less than four (inputs will be non negative integers)",
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
  allowedNodes: [
    RegularComponentType.Split,
    RegularComponentType.Combine,
    RegularComponentType.Constant,
    RegularComponentType.Multiply,
    RegularComponentType.Plus,
    RegularComponentType.Nop,
  ],
};

const MAX: Level = {
  id: "max",
  name: "Maximum",
  description:
    "Work out the maxium of two numbers - how hard can it be? (inputs will be non negative integers)",
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
      inputs: [[2], [4]],
      expectedOutputs: [[4]],
    },
  ],
  allowedNodes: [
    RegularComponentType.Split,
    RegularComponentType.Combine,
    RegularComponentType.Constant,
    RegularComponentType.Multiply,
    RegularComponentType.Plus,
    RegularComponentType.Nop,
  ],
};

const Reverse: Level = {
  id: "reverse",
  name: "Reverse",
  description:
    "Take the input numbers until you see a zero - then return the numbers in reverse order",
  testCases: [
    {
      inputs: [[1, 2, 3, 4, 0]],
      expectedOutputs: [[0, 4, 3, 2, 1]],
    },
    {
      inputs: [[6, 2, 8, 7, 0]],
      expectedOutputs: [[0, 7, 8, 2, 6]],
    },
  ],
  allowedNodes: [
    RegularComponentType.Split,
    RegularComponentType.Combine,
    RegularComponentType.Constant,
    RegularComponentType.Multiply,
    RegularComponentType.Plus,
    RegularComponentType.Nop,
  ],
};

const EulerianCycles: Level = {
  id: "euler",
  name: "Eulerian Cycles",
  description: "How many Eulerian cycles starting 12 are there in a K5 graph?",
  testCases: [
    {
      inputs: [],
      expectedOutputs: [[132]],
    },
  ],
  allowedNodes: [
    RegularComponentType.Split,
    RegularComponentType.Combine,
    RegularComponentType.Constant,
    RegularComponentType.Multiply,
    RegularComponentType.Plus,
    RegularComponentType.Nop,
    RegularComponentType.Push,
    RegularComponentType.Pop,
    RegularComponentType.Empty,
  ],
};

export type WorldInfo = {
  key: string;
  title: string;
  descrption: string;
};

export const WORLDS: WorldInfo[] = [
  {
    key: "1",
    title: "Beginnings",
    descrption:
      "The POSEVAC is out of the garage - lets see what we can get working",
  },
  {
    key: "2",
    title: "Lists and Strings",
    descrption: "Ok - it's working - time to start processing some real data!",
  },
  {
    key: "X",
    title: "Saftey limiter off",
    descrption:
      "Warning - highly experimental! It's violently shaking with all it's compute power, but if you want the Turing award, you need to master this",
  },
];

export const WorldMap = new Map([
  ["1", [ADDITION, CUM_SUM, FACTORIAL, Reverse, MULTIPLY, LESS_THAN_FOUR, MAX]],
  ["2", []],
  ["X", [EulerianCycles]],
]);

export const LEVELS = Array.from(WorldMap.values()).flatMap((x) => x);

export function getLevelById(id: string): Level {
  const ret = LEVELS.find((level) => level.id === id);
  if (ret === undefined) {
    throw Error(`Level Id ${id} not found`);
  }
  return ret;
}

export function nInputs(level: Level) {
  const ret = level.testCases[0].inputs.length;
  Assert(level.testCases.every((tc) => tc.inputs.length === ret));
  return ret;
}

export function nOutputs(level: Level) {
  const ret = level.testCases[0].expectedOutputs.length;
  Assert(level.testCases.every((tc) => tc.expectedOutputs.length === ret));
  return ret;
}

function ValidateTestCases(testCases: TestCase[]) {
  Assert(testCases.length > 0, "No test cases");
  Assert(
    testCases.every((tc) => tc.inputs.length === testCases[0].inputs.length),
    "Not all test cases have same number of inputs"
  );
  Assert(
    testCases.every(
      (tc) => tc.expectedOutputs.length === testCases[0].expectedOutputs.length
    ),
    "Not all test cases have same number of outputs"
  );
}

LEVELS.forEach((level) => ValidateTestCases(level.testCases));
