import { NodeSingular } from 'cytoscape';
import { cy } from './global_state'
import { getOutgoingEdges } from './graph_management';
import { ProgramCounter } from './program_counter';

interface AnimationState {
    programCounters: ProgramCounter[];
    stepHistory: NodeSingular[][];  // One history per program counter
    isAnimating: boolean;
}

// Animation state management
export const animationState: AnimationState = {
    programCounters: [],
    stepHistory: [],
    isAnimating: false
};

// Initialize animation - find start nodes and create program counters
function initializeAnimation(): boolean {
    // Find all start nodes
    const startNodes = cy.nodes('[type="start"]');

    if (startNodes.length === 0) {
        console.error('No start node found in graph');
        return false;
    }

    // Destroy old program counters if they exist
    for (const pc of animationState.programCounters) {
        pc.destroy();
    }

    // Create a program counter for each start node
    animationState.programCounters = [];
    animationState.stepHistory = [];

    startNodes.forEach((startNode, index) => {
        const label = startNodes.length > 1 ? `PC${index + 1}` : 'PC';
        const pc = new ProgramCounter(startNode, label);
        animationState.programCounters.push(pc);
        animationState.stepHistory.push([startNode]);
    });

    // Update button states
    updateButtonStates();

    console.log(`Animation initialized with ${startNodes.length} program counter(s)`);

    return true;
}

// Update PC marker positions when viewport changes (pan/zoom) or nodes move
function updatePCMarkerForViewportChange(): void {
    // Only update if animation is initialized and not currently animating
    if (animationState.programCounters.length === 0 || animationState.isAnimating) {
        return;
    }

    // Update all program counters
    for (const pc of animationState.programCounters) {
        pc.updateForViewportChange();
    }
}

// Step forward in animation - advances all program counters
async function stepForward(): Promise<void> {
    console.log('stepForward called');

    if (animationState.isAnimating) {
        console.log('Animation already in progress, ignoring');
        return;
    }

    // Initialize if needed (first time)
    if (animationState.programCounters.length === 0) {
        console.log('No program counters, initializing...');
        if (!initializeAnimation()) {
            console.log('Initialization failed');
            return;
        }
        console.log('Initialization succeeded');
        // Return after initialization - user needs to click forward again to actually move
        return;
    }

    animationState.isAnimating = true;

    try {
        // Advance each program counter that can move
        const movePromises = animationState.programCounters.map(async (pc, index) => {
            const currentNode = pc.currentLocation;

            console.log(`PC${index + 1} at:`, currentNode.id());

            // Get outgoing edges
            const outgoingEdges = getOutgoingEdges(currentNode);

            if (outgoingEdges.length === 0) {
                console.log(`PC${index + 1}: No outgoing edges - end of path`);
                return null;
            }

            if (outgoingEdges.length > 1) {
                console.error(`PC${index + 1}: Multiple output edges detected - not supported yet`);
                return null;
            }

            const edge = outgoingEdges[0];
            console.log(`PC${index + 1}: Following edge`);

            // Use the ProgramCounter's followEdge method (handles all 3 steps)
            const targetNode = await pc.followEdge(edge);

            // Update history for this program counter
            animationState.stepHistory[index].push(targetNode);

            console.log(`PC${index + 1}: Now at:`, targetNode.id());
            return targetNode;
        });

        // Wait for all program counters to complete their moves
        await Promise.all(movePromises);

        console.log('All program counters animation complete');
    } finally {
        animationState.isAnimating = false;
        updateButtonStates();
    }
}


// Step backward in animation - rewinds all program counters
async function stepBackward(): Promise<void> {
    if (animationState.isAnimating) return;
    if (animationState.programCounters.length === 0) return;

    // Check if any program counter can step back (history length > 1)
    const canStepBack = animationState.stepHistory.some(history => history.length > 1);
    if (!canStepBack) return;

    animationState.isAnimating = true;

    try {
        // Rewind each program counter that can move back
        const movePromises = animationState.programCounters.map(async (pc, index) => {
            const history = animationState.stepHistory[index];

            if (history.length <= 1) {
                // Already at start for this PC
                return null;
            }

            // Remove current node from history
            history.pop();
            const previousNode = history[history.length - 1];

            // Animate back to previous node
            await pc.moveTo(previousNode, true, 500);

            console.log(`PC${index + 1}: Moved back to:`, previousNode.id());
            return previousNode;
        });

        // Wait for all program counters to complete
        await Promise.all(movePromises);
    } finally {
        animationState.isAnimating = false;
        updateButtonStates();
    }
}

// Setup animation controls
export function setupAnimationControls(): void {
    const forwardBtn = document.getElementById('forwardBtn');
    const backBtn = document.getElementById('backBtn');
    const resetBtn = document.getElementById('resetBtn');

    if (!forwardBtn || !backBtn || !resetBtn) return;

    forwardBtn.addEventListener('click', stepForward);
    backBtn.addEventListener('click', stepBackward);
    resetBtn.addEventListener('click', resetAnimation);

    // Listen for viewport changes (pan/zoom)
    cy.on('pan zoom', updatePCMarkerForViewportChange);

    // Listen for node position changes (when user drags nodes)
    cy.on('position', 'node', updatePCMarkerForViewportChange);

    // Don't initialize until user clicks - they need to add nodes first
    // Initialize will happen automatically on first forward click
}

// Update button states based on current positions of all program counters
function updateButtonStates(): void {
    const forwardBtn = document.getElementById('forwardBtn') as HTMLButtonElement | null;
    const backBtn = document.getElementById('backBtn') as HTMLButtonElement | null;

    if (!forwardBtn || !backBtn) return;

    if (animationState.programCounters.length === 0) {
        forwardBtn.disabled = false; // Allow initialization
        backBtn.disabled = true;
        return;
    }

    // Forward: disabled if ALL program counters have no outgoing edges
    const anyCanMoveForward = animationState.programCounters.some((pc) => {
        const outgoingEdges = getOutgoingEdges(pc.currentLocation);
        return outgoingEdges.length > 0;
    });
    forwardBtn.disabled = !anyCanMoveForward;

    // Back: disabled if ALL program counters are at start
    const anyCanMoveBack = animationState.stepHistory.some(history => history.length > 1);
    backBtn.disabled = !anyCanMoveBack;
}


// Reset animation to start
function resetAnimation(): void {
    if (animationState.isAnimating) return;

    initializeAnimation();
}


