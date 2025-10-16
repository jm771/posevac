import { Core } from 'cytoscape';
import { editorContext } from './global_state'
import { ProgramCounter } from './program_counter';
import { EvaluateOutput } from './nodes';
import { AnimationState, GraphEditorContext, LevelContext, Stage } from './editor_context';

// Helper to get cy from context
function getCy(): Core {
    if (!editorContext) {
        throw new Error('Editor context not initialized');
    }
    return editorContext.cy;
}

function nextStage(stage : Stage) : Stage
{
    switch(stage) {
        case Stage.AdvanceCounter:
            return Stage.Evaluate
        case Stage.Evaluate:
            return Stage.AdvanceCounter;
    }
}

// Update PC marker positions when viewport changes (pan/zoom) or nodes move
function updatePCMarkerForViewportChange(): void {
    if (!editorContext) {
        return;
    }

    // Only update if animation is initialized and not currently animating
    if (editorContext.animationState.programCounters.size === 0 || editorContext.animationState.isAnimating) {
        return;
    }

    // Update all program counters
    for (const pc of editorContext.animationState.programCounters.values()) {
        pc.updateForViewportChange();
    }
}

async function evaluateFunctions(context : GraphEditorContext, animationState: AnimationState): Promise<void> {

    const evaluations : Array<EvaluateOutput> = context.allNodes.map(
        (node) => node.evaluate(animationState.nodeAnimationState.get(node.getNodeId())));

    const moveInAnimations = [];


    for (let i = 0; i < evaluations.length; i++)
    {
        evaluations[i].pcsDestroyed.forEach((pc: ProgramCounter) => {animationState.programCounters.delete(pc.id); });
        moveInAnimations.push(...evaluations[i].pcsDestroyed.map(pc => pc.animateMoveToNode(pc.currentLocation, context.allNodes[i].node)));
    }


    await Promise.all(moveInAnimations);

    evaluations.forEach(evaluation => evaluation.pcsDestroyed.forEach(pc => pc.destroy()))

    const moveOutAnimations: Array<Promise<void>> = [];

    for (let i = 0; i < evaluations.length; i++)
    {
        evaluations[i].pcsCreated.forEach( pc => {
            const parentNode = context.allNodes[i].node
            pc.initializePositionAndShow(parentNode);
            moveOutAnimations.push(pc.animateMoveToNode(parentNode, pc.currentLocation));
            animationState.programCounters.set(pc.id, pc);
        });
    }

    await Promise.all(moveOutAnimations);
}

async function advanceCounters(animationState: AnimationState): Promise<void> {
    if (!editorContext) {
        throw new Error('Editor context not initialized');
    }

    // Advance each program counter that can move
    const movePromises: Array<Promise<void>> = []
    animationState.programCounters.forEach((pc, _) => {
        const nextNode = pc.tryAdvance();
        if (nextNode != null) {
            movePromises.push(pc.animateMoveToNode(pc.currentLocation, nextNode, 600));
        }
    });


    // is this fine is some are none?
    // Wait for all program counters to complete their moves
    await Promise.all(movePromises);
}

// Step forward in animation - advances all program counters
async function stepForward(levelContext: LevelContext): Promise<void> {
    const animationState = levelContext.animationState;
    if (animationState.isAnimating) {
        console.log('Animation already in progress, ignoring');
        return;
    }

    animationState.isAnimating = true;

    try {
        switch (animationState.stage) {
            case Stage.AdvanceCounter:
                await advanceCounters(animationState);
                break;
            case Stage.Evaluate:
                await evaluateFunctions(levelContext.editorContex, animationState);
                break;
        }

        animationState.stage = nextStage(animationState.stage);
    }
    finally
    {
        animationState.isAnimating = false;
        updateButtonStates();
    }
}

async function stepBackward(): Promise<void> {
    // TODO implementOrBin
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
    if (!editorContext) {
        throw new Error('Editor context not initialized');
    }

    if (editorContext.animationState.isAnimating) return;

    editorContext.animationState.resetState();
}


