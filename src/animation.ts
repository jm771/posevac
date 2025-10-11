import { NodeSingular } from 'cytoscape';
import { cy } from './global_state'
import { getOutgoingEdges } from './graph_management';
import { ProgramCounter } from './program_counter';

interface AnimationState {
    programCounter: ProgramCounter | null;
    stepHistory: NodeSingular[];
    isAnimating: boolean;
}

// Animation state management
export const animationState: AnimationState = {
    programCounter: null,
    stepHistory: [],
    isAnimating: false
};

// Initialize animation - find start node and position marker
function initializeAnimation(): boolean {
    // Find start node
    const startNodes = cy.nodes('[type="start"]');

    if (startNodes.length === 0) {
        console.error('No start node found in graph');
        return false;
    }

    if (startNodes.length > 1) {
        console.warn('Multiple start nodes found, using first one');
    }

    const startNode = startNodes[0];

    // Destroy old program counter if it exists
    if (animationState.programCounter) {
        animationState.programCounter.destroy();
    }

    // Create new program counter at start node
    animationState.programCounter = new ProgramCounter(startNode, 'PC');
    animationState.stepHistory = [startNode];

    // Update button states
    updateButtonStates();

    console.log('Animation initialized at start node:', startNode.id());

    return true;
}

// Update PC marker position when viewport changes (pan/zoom) or nodes move
function updatePCMarkerForViewportChange(): void {
    // Only update if animation is initialized and not currently animating
    if (!animationState.programCounter || animationState.isAnimating) {
        return;
    }

    animationState.programCounter.updateForViewportChange();
}

// Step forward in animation
async function stepForward(): Promise<void> {
    console.log('stepForward called');

    if (animationState.isAnimating) {
        console.log('Animation already in progress, ignoring');
        return;
    }

    // Initialize if needed (first time)
    if (!animationState.programCounter) {
        console.log('No program counter, initializing...');
        if (!initializeAnimation()) {
            console.log('Initialization failed');
            return;
        }
        console.log('Initialization succeeded');
        // Return after initialization - user needs to click forward again to actually move
        return;
    }

    const pc = animationState.programCounter;
    const currentNode = pc.currentLocation;

    if (!currentNode) {
        console.error('Program counter has no current location');
        return;
    }

    console.log('Current node:', currentNode.id());

    // Get outgoing edges
    const outgoingEdges = getOutgoingEdges(currentNode);
    console.log('Outgoing edges:', outgoingEdges.length);

    if (outgoingEdges.length === 0) {
        console.log('No outgoing edges - end of path');
        updateButtonStates();
        return;
    }

    if (outgoingEdges.length > 1) {
        console.error('Multiple output edges detected - not supported yet');
        updateButtonStates();
        return;
    }

    animationState.isAnimating = true;

    try {
        const edge = outgoingEdges[0];
        console.log('Following edge from', currentNode.id());

        // Use the ProgramCounter's followEdge method (handles all 3 steps)
        const targetNode = await pc.followEdge(edge);

        // Update state
        animationState.stepHistory.push(targetNode);

        console.log('Animation complete, now at:', targetNode.id());
    } finally {
        animationState.isAnimating = false;
        updateButtonStates();
    }
}


// Step backward in animation
async function stepBackward(): Promise<void> {
    if (animationState.isAnimating) return;
    if (animationState.stepHistory.length <= 1) return; // Can't go before start
    if (!animationState.programCounter) return;

    animationState.isAnimating = true;

    // Remove current node from history
    animationState.stepHistory.pop();
    const previousNode = animationState.stepHistory[animationState.stepHistory.length - 1];

    // Animate back to previous node
    await animationState.programCounter.moveTo(previousNode, true, 500);

    animationState.isAnimating = false;

    updateButtonStates();
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

// Update button states based on current position
function updateButtonStates(): void {
    const forwardBtn = document.getElementById('forwardBtn') as HTMLButtonElement | null;
    const backBtn = document.getElementById('backBtn') as HTMLButtonElement | null;

    if (!forwardBtn || !backBtn) return;

    if (!animationState.programCounter || !animationState.programCounter.currentLocation) {
        forwardBtn.disabled = false; // Allow initialization
        backBtn.disabled = true;
        return;
    }

    // Forward: disabled if no outgoing edges
    const outgoingEdges = getOutgoingEdges(animationState.programCounter.currentLocation);
    forwardBtn.disabled = outgoingEdges.length === 0;

    // Back: disabled if at start
    backBtn.disabled = animationState.stepHistory.length <= 1;
}


// Reset animation to start
function resetAnimation(): void {
    if (animationState.isAnimating) return;

    initializeAnimation();
}


