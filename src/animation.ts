import { NodeSingular } from 'cytoscape';
import { cy } from './global_state'
import { getOutgoingEdges } from './graph_management';
import { ProgramCounter } from './program_counter';

// Snapshot of a single program counter's state
interface ProgramCounterSnapshot {
    id: string;
    location: NodeSingular;
    contents: string;
}

// Snapshot of the entire animation state at a point in time
interface AnimationSnapshot {
    programCounters: ProgramCounterSnapshot[];
}

interface AnimationState {
    programCounters: ProgramCounter[];
    history: AnimationSnapshot[];  // Complete snapshots at each step
    isAnimating: boolean;
}

// Animation state management
export const animationState: AnimationState = {
    programCounters: [],
    history: [],
    isAnimating: false
};

// Helper: Create a snapshot of the current animation state
function captureSnapshot(): AnimationSnapshot {
    return {
        programCounters: animationState.programCounters.map(pc => pc.createSnapshot())
    };
}

// Initialize animation - find input nodes and create program counters
function initializeAnimation(): boolean {
    // Destroy old program counters if they exist
    for (const pc of animationState.programCounters) {
        pc.destroy();
    }

    // Create a program counter for each input node
    animationState.programCounters = [];
    animationState.history = [];

    // Save initial snapshot
    animationState.history.push(captureSnapshot());

    // Update button states
    updateButtonStates();

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

    // For each input - if nothing on output terminal - add the next value
    // For each each program counter on an output terminal - if they can move to in input terminal - move them
    // For each function cell - if all the input are there, and no outputs are there - move to the middle - 
    // then create new program counters with output
    // move them to output terminal

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

            console.log(`PC${index + 1}: Now at:`, targetNode.id());
            return targetNode;
        });

        // Wait for all program counters to complete their moves
        await Promise.all(movePromises);

        // Save snapshot of current state after all moves complete
        animationState.history.push(captureSnapshot());

        console.log('All program counters animation complete');
    } finally {
        animationState.isAnimating = false;
        updateButtonStates();
    }
}


// Step backward in animation - restore from previous snapshot
async function stepBackward(): Promise<void> {
    if (animationState.isAnimating) return;

    // Need at least 2 snapshots (current and previous)
    if (animationState.history.length <= 1) return;

    animationState.isAnimating = true;

    try {
        // Remove current snapshot
        animationState.history.pop();

        // Get previous snapshot
        const previousSnapshot = animationState.history[animationState.history.length - 1];

        console.log('Restoring to previous snapshot with', previousSnapshot.programCounters.length, 'program counters');

        // Build map of current PCs by ID
        const currentPCsById = new Map<string, ProgramCounter>();
        animationState.programCounters.forEach(pc => {
            currentPCsById.set(pc.id, pc);
        });

        // Build map of snapshot PCs by ID
        const snapshotPCsById = new Map<string, ProgramCounterSnapshot>();
        previousSnapshot.programCounters.forEach(pcSnap => {
            snapshotPCsById.set(pcSnap.id, pcSnap);
        });

        // Destroy PCs that don't exist in the snapshot
        const pcsToKeep: ProgramCounter[] = [];
        for (const pc of animationState.programCounters) {
            if (snapshotPCsById.has(pc.id)) {
                pcsToKeep.push(pc);
            } else {
                console.log(`Destroying PC ${pc.id} (${pc.contents})`);
                pc.destroy();
            }
        }

        // Create PCs that exist in snapshot but not in current state
        for (const pcSnap of previousSnapshot.programCounters) {
            if (!currentPCsById.has(pcSnap.id)) {
                console.log(`Creating PC ${pcSnap.id} (${pcSnap.contents}) at`, pcSnap.location.id());
                const newPC = new ProgramCounter(pcSnap.location, pcSnap.contents);
                // Override the uniqueId to match the snapshot (hacky but necessary)
                (newPC as any).uniqueId = pcSnap.id;
                pcsToKeep.push(newPC);
            }
        }

        // Update animationState.programCounters to match snapshot order
        animationState.programCounters = previousSnapshot.programCounters.map(pcSnap => {
            const pc = pcsToKeep.find(p => p.id === pcSnap.id);
            if (!pc) throw new Error(`PC ${pcSnap.id} not found`);
            return pc;
        });

        // Restore state of each PC
        for (const pc of animationState.programCounters) {
            const pcSnap = snapshotPCsById.get(pc.id);
            if (pcSnap) {
                pc.restoreFromSnapshot(pcSnap.location, pcSnap.contents);
                console.log(`Restored PC ${pc.id} to`, pcSnap.location.id());
            }
        }

        console.log('Snapshot restoration complete');
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

    // Back: disabled if only one snapshot (no previous state to return to)
    backBtn.disabled = animationState.history.length <= 1;
}


// Reset animation to start
function resetAnimation(): void {
    if (animationState.isAnimating) return;

    initializeAnimation();
}


