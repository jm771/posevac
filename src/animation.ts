import { ProgramCounter } from './program_counter';
import { EvaluateOutput } from './nodes';
import { AnimationState, GraphEditorContext, LevelContext, Stage } from './editor_context';

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
function updatePCMarkerForViewportChange(levelContext: LevelContext): void {
    if (levelContext.animationState === null) {
        throw Error("Null level context");
    }

    const animationState : AnimationState = levelContext.animationState;

    // Only update if animation is initialized and not currently animating
    if (animationState.programCounters.size === 0 || animationState.isAnimating) {
        return;
    }

    // Update all program counters
    for (const pc of animationState.programCounters.values()) {
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
    // Advance each program counter that can move
    const movePromises: Array<Promise<void>> = []
    animationState.programCounters.forEach((pc, _) => {
        const nextNode = pc.tryAdvance();
        if (nextNode != null) {
            movePromises.push(pc.animateMoveToNode(pc.currentLocation, nextNode, 600));
        }
    });

    await Promise.all(movePromises);
}

async function stepForward(levelContext: LevelContext): Promise<void> {
    if (levelContext.animationState == null) {
        // Doesn't feel amazing - but I guess I do want to start the animation with the foward button.
        levelContext.animationState = new AnimationState(levelContext.editorContext.allNodes);
    }
    const animationState : AnimationState = levelContext.animationState;
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
                await evaluateFunctions(levelContext.editorContext, animationState);
                break;
        }

        animationState.stage = nextStage(animationState.stage);
    }
    finally
    {
        animationState.isAnimating = false;
    }
}

// Setup animation controls
export function setupAnimationControls(levelContext : LevelContext): void {
    const forwardBtn = document.getElementById('forwardBtn');
    const resetBtn = document.getElementById('resetBtn');

    if (!forwardBtn || !resetBtn) return;

    forwardBtn.addEventListener('click', () => stepForward(levelContext));
    resetBtn.addEventListener('click', () => resetAnimation(levelContext));

    
    levelContext.editorContext.cy.on('pan zoom', () => updatePCMarkerForViewportChange(levelContext));
    levelContext.editorContext.cy.on('position', 'node', () => updatePCMarkerForViewportChange(levelContext));
}

function resetAnimation(levelContext : LevelContext): void {
    if (levelContext.animationState?.isAnimating) return;

    levelContext.animationState?.destroy();

    levelContext.animationState = null //new AnimationState(levelContext.editorContex.allNodes);

}


