// Level data structure for the graph editing game

export type ComponentType = 'plus' | 'multiply' | 'combine' | 'split' | 'nop' | 'constant';

export interface Level {
    id: string;
    name: string;
    description: string;
    inputs: any[][];  // Array of arrays - each inner array represents inputs for one input node
    expectedOutputs: any[][];  // Array of arrays - expected outputs
    allowedNodes: ComponentType[];
}

// Level definitions
export const LEVELS: Level[] = [
    {
        id: 'addition',
        name: 'Addition',
        description: 'Learn the basics! Connect two numbers to a plus node to add them together.',
        inputs: [[3, 5, 7], [7, 8, 10]],
        expectedOutputs: [[10, 13, 17]],
        allowedNodes: ['plus']
    },
    {
        id: 'cum-sum',
        name: 'Cumulative Sum',
        description: 'Learn basic looping and branching - compute the cumulative sum of some numbers',
        inputs: [[1, 2, 3, 4, 5]],
        expectedOutputs: [[1, 3, 6, 10, 15]],
        allowedNodes: ['plus', 'constant']
    },
    {
        id: 'factorial',
        name: 'Factorial',
        description: 'Split and combine together with conditional branches let us compute factorial',
        inputs: [[5]],
        expectedOutputs: [[120]],
        allowedNodes: ['split', 'combine', 'constant']
    }
];

// Get level by ID
export function getLevelById(id: string): Level | undefined {
    return LEVELS.find(level => level.id === id);
}
