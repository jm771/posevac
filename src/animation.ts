import { NodeSingular, EdgeSingular } from 'cytoscape';
import { cy } from './global_state'
import { getOutgoingEdges } from './graph_management';

interface Position {
    x: number;
    y: number;
}

interface Waypoint extends Position {
    angle: number;
}

interface AnimationState {
    currentNode: NodeSingular | null;
    stepHistory: NodeSingular[];
    isAnimating: boolean;
    arrowTipX: number;
    arrowTipY: number;
    currentAngle: number;
    arrowSvg: SVGElement | null;
    arrowLine: SVGLineElement | null;
    arrowHead: SVGPolygonElement | null;
    pcBox: HTMLDivElement | null;
}

// Animation state management
export const animationState: AnimationState = {
    currentNode: null,
    stepHistory: [],
    isAnimating: false,
    arrowTipX: 0,
    arrowTipY: 0,
    currentAngle: 0,
    arrowSvg: null,
    arrowLine: null,
    arrowHead: null,
    pcBox: null
};

// Helper: Calculate PC marker position (offset above and to the side of arrow tip)
function updatePCMarkerPosition(arrowTipX: number, arrowTipY: number, arrowAngle: number): void {
    const { arrowLine, arrowHead, pcBox } = animationState;

    if (!arrowLine || !arrowHead || !pcBox) return;

    // PC box should be offset above and to the side of the arrow tip
    // Constant offset distance from arrow tip to PC center
    const offsetDistance = 50; // pixels
    const offsetAngle = arrowAngle - 30; // 30 degrees counter-clockwise from arrow direction

    const pcCenterX = arrowTipX + offsetDistance * Math.cos(offsetAngle * Math.PI / 180);
    const pcCenterY = arrowTipY + offsetDistance * Math.sin(offsetAngle * Math.PI / 180);

    // Position the PC box (uses transform: translate(-50%, -50%) to center)
    pcBox.style.left = pcCenterX + 'px';
    pcBox.style.top = pcCenterY + 'px';
    pcBox.style.display = 'flex'; // Make visible

    // Draw arrow from PC center to arrow tip
    arrowLine.setAttribute('x1', pcCenterX.toString());
    arrowLine.setAttribute('y1', pcCenterY.toString());
    arrowLine.setAttribute('x2', arrowTipX.toString());
    arrowLine.setAttribute('y2', arrowTipY.toString());

    // Arrowhead at the tip
    const arrowheadSize = 10;
    const angle = Math.atan2(arrowTipY - pcCenterY, arrowTipX - pcCenterX);
    const x1 = arrowTipX;
    const y1 = arrowTipY;
    const x2 = arrowTipX - arrowheadSize * Math.cos(angle - Math.PI / 6);
    const y2 = arrowTipY - arrowheadSize * Math.sin(angle - Math.PI / 6);
    const x3 = arrowTipX - arrowheadSize * Math.cos(angle + Math.PI / 6);
    const y3 = arrowTipY - arrowheadSize * Math.sin(angle + Math.PI / 6);

    arrowHead.setAttribute('points', `${x1},${y1} ${x2},${y2} ${x3},${y3}`);

    // Store current arrow tip position and angle
    animationState.arrowTipX = arrowTipX;
    animationState.arrowTipY = arrowTipY;
    animationState.currentAngle = arrowAngle;
}

// Helper: Convert model coordinates to canvas-relative coordinates
// Returns coordinates relative to the canvas-container (where the SVG overlay is positioned)
function modelToScreen(modelX: number, modelY: number): Position {
    const pan = cy.pan();
    const zoom = cy.zoom();

    // Calculate rendered position (relative to canvas)
    const renderedX = modelX * zoom + pan.x;
    const renderedY = modelY * zoom + pan.y;

    return {
        x: renderedX,
        y: renderedY
    };
}

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
    const startPos = startNode.position();

    // Convert start node center to screen coordinates
    const screenPos = modelToScreen(startPos.x, startPos.y);

    // Initialize marker elements
    animationState.arrowSvg = document.getElementById('pcArrow') as SVGElement | null;
    animationState.arrowLine = document.getElementById('pcArrowLine') as SVGLineElement | null;
    animationState.arrowHead = document.getElementById('pcArrowHead') as SVGPolygonElement | null;
    animationState.pcBox = document.getElementById('pcBox') as HTMLDivElement | null;
    animationState.currentNode = startNode;
    animationState.stepHistory = [startNode];

    // Show the SVG overlay
    if (animationState.arrowSvg) {
        animationState.arrowSvg.style.display = 'block';
    }

    // Position arrow tip at start node center, pointing right (0 degrees)
    updatePCMarkerPosition(screenPos.x, screenPos.y, 0);

    // Update button states
    updateButtonStates();

    console.log('Animation initialized at', screenPos);

    return true;
}

// Animate along a path with multiple waypoints
function animateAlongPath(waypoints: Waypoint[], duration: number): Promise<void> {
    return new Promise((resolve) => {
        if (!waypoints || waypoints.length === 0) {
            console.error('No waypoints provided for animation');
            resolve();
            return;
        }

        console.log('Starting animation with', waypoints.length, 'waypoints over', duration, 'ms');

        const startTime = performance.now();

        function animate(currentTime: number): void {
            const elapsed = currentTime - startTime;
            // Clamp progress between 0 and 1 to handle timing edge cases
            const progress = Math.min(Math.max(elapsed / duration, 0), 1);

            // Find which segment we're on
            const segmentCount = waypoints.length - 1;

            if (segmentCount <= 0) {
                // Only one waypoint (or invalid), just position there
                console.log('Single waypoint, positioning at:', waypoints[0]);
                updatePCMarkerPosition(waypoints[0].x, waypoints[0].y, waypoints[0].angle);
                resolve();
                return;
            }

            const segmentProgress = progress * segmentCount;
            const segmentIndex = Math.floor(segmentProgress);
            const localProgress = segmentProgress - segmentIndex;

            if (segmentIndex >= segmentCount) {
                // Animation complete - position at final waypoint
                const final = waypoints[waypoints.length - 1];
                console.log('Animation complete at final waypoint:', final);
                updatePCMarkerPosition(final.x, final.y, final.angle);
                resolve();
                return;
            }

            // Interpolate between current and next waypoint
            const current = waypoints[segmentIndex];
            const next = waypoints[segmentIndex + 1];

            if (!current || !next) {
                console.error('Invalid waypoint - current:', current, 'next:', next, 'index:', segmentIndex, 'total:', waypoints.length);
                console.error('All waypoints:', waypoints);
                resolve();
                return;
            }

            const x = current.x + (next.x - current.x) * localProgress;
            const y = current.y + (next.y - current.y) * localProgress;
            const angle = current.angle + (next.angle - current.angle) * localProgress;

            updatePCMarkerPosition(x, y, angle);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                console.log('Animation progress complete');
                resolve();
            }
        }

        requestAnimationFrame(animate);
    });
}


// Update PC marker position when viewport changes (pan/zoom) or nodes move
function updatePCMarkerForViewportChange(): void {
    // Only update if animation is initialized and not currently animating
    if (!animationState.currentNode || !animationState.pcBox || animationState.isAnimating) {
        return;
    }

    // Recalculate the position based on current node's current position
    const currentPos = animationState.currentNode.position();
    const screenPos = modelToScreen(currentPos.x, currentPos.y);

    // Update marker to point at current node, preserving the current angle
    updatePCMarkerPosition(screenPos.x, screenPos.y, animationState.currentAngle);
}


// Step backward in animation
async function stepBackward(): Promise<void> {
    if (animationState.isAnimating) return;
    if (animationState.stepHistory.length <= 1) return; // Can't go before start

    animationState.isAnimating = true;

    // Remove current node from history
    animationState.stepHistory.pop();
    const previousNode = animationState.stepHistory[animationState.stepHistory.length - 1];

    // Animate back to previous node
    const targetPos = previousNode.position();
    const targetScreen = modelToScreen(targetPos.x, targetPos.y);

    await animateAlongPath([
        { x: animationState.arrowTipX, y: animationState.arrowTipY, angle: 0 },
        { x: targetScreen.x, y: targetScreen.y, angle: 0 }
    ], 500);

    animationState.currentNode = previousNode;
    animationState.isAnimating = false;

    updateButtonStates();
}

// Setup animation controls
function setupAnimationControls(): void {
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

    if (!animationState.currentNode) {
        forwardBtn.disabled = true;
        backBtn.disabled = true;
        return;
    }

    // Forward: disabled if no outgoing edges
    const outgoingEdges = getOutgoingEdges(animationState.currentNode);
    forwardBtn.disabled = outgoingEdges.length === 0;

    // Back: disabled if at start
    backBtn.disabled = animationState.stepHistory.length <= 1;
}


// Reset animation to start
function resetAnimation(): void {
    if (animationState.isAnimating) return;

    initializeAnimation();
}


