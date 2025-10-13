import { Core, NodeSingular } from 'cytoscape';
import { editorContext } from './global_state'
import { getOutgoingEdges } from './graph_management';
import { ProgramCounter } from './program_counter';
import { EvaluateOutput } from './nodes';
import { GraphEditorContext } from './editor_context';

// Helper to get cy from context
function getCy(): Core {
    if (!editorContext) {
        throw new Error('Editor context not initialized');
    }
    return editorContext.cy;
}

enum Stage {
    AdvanceCounter = 1,
    Evaluate
}

function nextStage(stage : Stage) : Stage
{
    switch(stage) {
        case Stage.AdvanceCounter:
            return Stage.Evaluate;
        case Stage.Evaluate:
            return Stage.AdvanceCounter;
    }
}

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
    stage: Stage
}

// Animation state management
export const animationState: AnimationState = {
    programCounters: [],
    history: [],
    isAnimating: false,
    stage: Stage.Evaluate
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
    animationState.stage = Stage.Evaluate;

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

async function evaluateFunctions(editorContext : GraphEditorContext): Promise<void> {

    const evaluations : Array<EvaluateOutput> = editorContext.allNodes.map((node) => node.evaluate());

    const moveInAnimations = [];
    

    for (let i = 0; i < evaluations.length; i++)
    {
        moveInAnimations.push(...evaluations[i].pcsDestroyed.map(pc => pc.animateMoveToNode(editorContext.allNodes[i].getNode())));
    }

    
    await Promise.all(moveInAnimations);

    const moveOutAnimations: Array<Promise<void>> = [];

    for (let i = 0; i < evaluations.length; i++)
    {
        // Can animate properly later
        evaluations[i].pcsCreated.forEach(pc => moveOutAnimations.push(pc.animateMoveToNode(pc.currentLocation)));
    }

    await Promise.all(moveOutAnimations);
}

async function advanceCounters(): Promise<void> {
    // Advance each program counter that can move
    const movePromises = animationState.programCounters.map(async (pc, index) => {
        const nextNode = pc.tryAdvance();
        if (nextNode != null) {
            return pc.animateMoveToNode(nextNode);
        }

        return nextNode;
    });


    // is this fine is some are none?
    // Wait for all program counters to complete their moves
    await Promise.all(movePromises);
}

// Step forward in animation - advances all program counters
async function stepForward(): Promise<void> {
    if (animationState.isAnimating) {
        console.log('Animation already in progress, ignoring');
        return;
    }

    animationState.isAnimating = true;

    if (editorContext == null) {
        throw Error("need non null editor context");
    }


    try {
        switch (animationState.stage) {
            case Stage.AdvanceCounter:
                await advanceCounters();
                break;
            case Stage.Evaluate:
                await evaluateFunctions(editorContext);
                break;
        }

        animationState.stage = nextStage(animationState.stage);
        // Save snapshot of current state after all moves complete
        animationState.history.push(captureSnapshot());
    }
    finally 
    {
        animationState.isAnimating = false;
        updateButtonStates();
    }


    // For each input - if nothing on output terminal - add the next value
    // For each each program counter on an output terminal - if they can move to in input terminal - move them
    // For each function cell - if all the input are there, and no outputs are there - move to the middle - 
    // then create new program counters with output
    // move them to output terminal
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
    getCy().on('pan zoom', updatePCMarkerForViewportChange);

    // Listen for node position changes (when user drags nodes)
    getCy().on('position', 'node', updatePCMarkerForViewportChange);

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


