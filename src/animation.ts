import { Core } from 'cytoscape';
import { editorContext } from './global_state'
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


interface AnimationState {
    programCounters: Map<string, ProgramCounter>;
    isAnimating: boolean;
    stage: Stage
}

// Animation state management
export const animationState: AnimationState = {
    programCounters: new Map<string, ProgramCounter>(),
    isAnimating: false,
    stage: Stage.Evaluate
};

// Initialize animation - find input nodes and create program counters
function initializeAnimation(): boolean {
    // Destroy old program counters if they exist
    for (const pc of animationState.programCounters.values()) {
        pc.destroy();
    }

    // Create a program counter for each input node
    animationState.programCounters = new Map<string, ProgramCounter>();
    animationState.stage = Stage.Evaluate;

    // Update button states
    updateButtonStates();

    return true;
}

// Update PC marker positions when viewport changes (pan/zoom) or nodes move
function updatePCMarkerForViewportChange(): void {
    // Only update if animation is initialized and not currently animating
    if (animationState.programCounters.size === 0 || animationState.isAnimating) {
        return;
    }

    // Update all program counters
    for (const pc of animationState.programCounters.values()) {
        pc.updateForViewportChange();
    }
}

async function evaluateFunctions(editorContext : GraphEditorContext): Promise<void> {

    const evaluations : Array<EvaluateOutput> = editorContext.allNodes.map((node) => node.evaluate());

    const moveInAnimations = [];
    

    for (let i = 0; i < evaluations.length; i++)
    {
        evaluations[i].pcsDestroyed.forEach((pc: ProgramCounter) => {animationState.programCounters.delete(pc.id); });
        moveInAnimations.push(...evaluations[i].pcsDestroyed.map(pc => pc.animateMoveToNode(editorContext.allNodes[i].getNode())));
    }

    
    await Promise.all(moveInAnimations);

    evaluations.forEach(evaluation => evaluation.pcsDestroyed.forEach(pc => pc.destroy()))

    const moveOutAnimations: Array<Promise<void>> = [];

    for (let i = 0; i < evaluations.length; i++)
    {
        // Can animate properly later
        evaluations[i].pcsCreated.forEach( pc => {
            moveOutAnimations.push(pc.animateMoveToNode(pc.currentLocation));
            animationState.programCounters.set(pc.id, pc);
        });
    }

    await Promise.all(moveOutAnimations);
}

async function advanceCounters(): Promise<void> {
    // Advance each program counter that can move
    const movePromises: Array<Promise<void>> = []
    animationState.programCounters.forEach((pc, _) => {
        const nextNode = pc.tryAdvance();
        if (nextNode != null) {
            movePromises.push(pc.animateMoveToNode(nextNode));
        }
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



async function stepBackward(): Promise<void> {
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
}


// Reset animation to start
function resetAnimation(): void {
    if (animationState.isAnimating) return;

    initializeAnimation();
}


