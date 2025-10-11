// Interactive Graph Tool with Cytoscape.js
// Main application logic

import { NodeSingular, EdgeSingular } from 'cytoscape';
import { cy } from './global_state'
import { initCytoscape } from './global_state'
import { initializePreviews, setupNodeDeletion, setupSidebarDragDrop } from './sidebar';

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

// Global state

let edgeIdCounter = 0;
let tempEdge: EdgeSingular | null = null;


// Setup right-click edge creation/deletion
function setupEdgeCreation(): void {
    let isRightDragging = false;
    let sourceNode: NodeSingular | null = null;
    let mousePos: Position = { x: 0, y: 0 };

    // Prevent context menu on cytoscape canvas
    const cyContainer = document.getElementById('cy');
    if (!cyContainer) return;

    cyContainer.addEventListener('contextmenu', (e: Event) => {
        e.preventDefault();
    });

    // Track right mouse button down on node using DOM event
    cyContainer.addEventListener('mousedown', function(e: MouseEvent) {
        if (e.button === 2) { // Right click
            // Get mouse position and check if we're on a node
            const cyBounds = cyContainer.getBoundingClientRect();
            const renderedX = e.clientX - cyBounds.left;
            const renderedY = e.clientY - cyBounds.top;

            const pan = cy.pan();
            const zoom = cy.zoom();
            const modelX = (renderedX - pan.x) / zoom;
            const modelY = (renderedY - pan.y) / zoom;

            // Find node at this position
            const elements = cy.elements().filter(function(ele) {
                if (ele.isNode()) {
                    const bb = ele.boundingBox();
                    return modelX >= bb.x1 && modelX <= bb.x2 &&
                           modelY >= bb.y1 && modelY <= bb.y2;
                }
                return false;
            });

            if (elements.length > 0) {
                // Sort by size and pick smallest
                const sorted = elements.sort(function(a, b) {
                    const aBox = a.boundingBox();
                    const bBox = b.boundingBox();
                    const aArea = (aBox.x2 - aBox.x1) * (aBox.y2 - aBox.y1);
                    const bArea = (bBox.x2 - bBox.x1) * (bBox.y2 - bBox.y1);
                    return aArea - bArea;
                });
                const node = sorted[0] as NodeSingular;

                // Only allow connections to start from output terminals
                if (node.data('terminalType') === 'output') {
                    e.preventDefault();
                    e.stopPropagation();

                    isRightDragging = true;
                    sourceNode = node;
                    mousePos = { x: modelX, y: modelY };

                    // Disable normal node dragging during right-click drag
                    cy.autoungrabify(true);
                }
            }
        }
    });

    // Track mouse movement with DOM event
    cyContainer.addEventListener('mousemove', function(e: MouseEvent) {
        if (isRightDragging && sourceNode) {
            // Convert screen position to model position
            const cyBounds = cyContainer.getBoundingClientRect();
            const renderedX = e.clientX - cyBounds.left;
            const renderedY = e.clientY - cyBounds.top;

            const pan = cy.pan();
            const zoom = cy.zoom();
            const modelX = (renderedX - pan.x) / zoom;
            const modelY = (renderedY - pan.y) / zoom;

            // Store mouse position
            mousePos = { x: modelX, y: modelY };

            // Remove previous temp edge
            if (tempEdge) {
                cy.remove(tempEdge);
            }

            const tempTargetId = 'temp-target';

            // Remove old temp target if exists
            cy.$(`#${tempTargetId}`).remove();

            // Create invisible temp target node at cursor position
            cy.add({
                group: 'nodes',
                data: { id: tempTargetId },
                position: mousePos,
                style: { 'opacity': 0, 'width': 1, 'height': 1 }
            });

            tempEdge = cy.add({
                group: 'edges',
                data: {
                    id: 'temp-edge',
                    source: sourceNode.id(),
                    target: tempTargetId
                },
                classes: 'temp'
            }) as EdgeSingular;
        }
    });

    // Handle mouse up with DOM event
    cyContainer.addEventListener('mouseup', function(e: MouseEvent) {
        if (e.button === 2 && isRightDragging) { // Right button
            // Clean up temp edge
            if (tempEdge) {
                cy.remove(tempEdge);
                tempEdge = null;
            }
            cy.$('#temp-target').remove();

            // Find what node is at the current mouse position
            const elements = cy.elements().filter(function(ele) {
                if (ele.isNode()) {
                    const bb = ele.boundingBox();
                    return mousePos.x >= bb.x1 && mousePos.x <= bb.x2 &&
                           mousePos.y >= bb.y1 && mousePos.y <= bb.y2;
                }
                return false;
            });

            // Get the top-most node (smallest one, likely a terminal or regular node)
            let targetNode: NodeSingular | null = null;
            if (elements.length > 0) {
                // Sort by size (area) and pick the smallest
                const sorted = elements.sort(function(a, b) {
                    const aBox = a.boundingBox();
                    const bBox = b.boundingBox();
                    const aArea = (aBox.x2 - aBox.x1) * (aBox.y2 - aBox.y1);
                    const bArea = (bBox.x2 - bBox.x1) * (bBox.y2 - bBox.y1);
                    return aArea - bArea;
                });
                targetNode = sorted[0] as NodeSingular;
            }

            // Create or delete edge if we have a valid target
            if (sourceNode && targetNode && sourceNode.id() !== targetNode.id()) {
                // Validate edge rules:
                // 1. Source must be an output terminal
                // 2. Target must be an input terminal
                // 3. Can't connect to compound parent (start/stop)

                const sourceType = sourceNode.data('terminalType');
                const targetType = targetNode.data('terminalType');

                // Check if source is output and target is input
                if (sourceType === 'output' && targetType === 'input') {
                    // Check if edge already exists
                    const existingEdge = cy.edges(`[source="${sourceNode.id()}"][target="${targetNode.id()}"]`);

                    if (existingEdge.length > 0) {
                        // Delete existing edge
                        existingEdge.remove();
                    } else {
                        // Check if target input already has an incoming edge
                        const targetIncomingEdges = cy.edges(`[target="${targetNode.id()}"]`);

                        if (targetIncomingEdges.length > 0) {
                            // Target already has an incoming edge - reject with visual feedback
                            console.log('Input terminal already has a connection');
                            // Could add visual feedback here (flash red, etc.)
                        } else {
                            // Create new edge
                            cy.add({
                                group: 'edges',
                                data: {
                                    id: `edge-${edgeIdCounter++}`,
                                    source: sourceNode.id(),
                                    target: targetNode.id()
                                }
                            });
                        }
                    }
                } else {
                    // Invalid connection direction
                    console.log('Edges can only go from output terminals to input terminals');
                }
            }

            // Reset state
            sourceNode = null;
            isRightDragging = false;
            cy.autoungrabify(false);
        }
    });
}

// Animation state management
const animationState: AnimationState = {
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

// Get output terminals from a node
function getOutputTerminals(node: NodeSingular): NodeSingular[] {
    // For start nodes, find the output terminal child
    const nodeType = node.data('type');
    if (nodeType === 'start' || nodeType === 'compound') {
        const children = node.children();
        return children.filter(child => child.data('terminalType') === 'output').toArray() as NodeSingular[];
    }

    return [];
}

// Get outgoing edges from output terminals
function getOutgoingEdges(node: NodeSingular): EdgeSingular[] {
    const outputTerminals = getOutputTerminals(node);
    let edges: EdgeSingular[] = [];

    outputTerminals.forEach(terminal => {
        const terminalEdges = cy.edges(`[source="${terminal.id()}"]`);
        edges = edges.concat(terminalEdges.toArray() as EdgeSingular[]);
    });

    return edges;
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

// Step forward in animation
async function stepForward(): Promise<void> {
    console.log('stepForward called');

    if (animationState.isAnimating) {
        console.log('Animation already in progress, ignoring');
        return;
    }

    // Initialize if needed (first time)
    if (!animationState.currentNode) {
        console.log('No current node, initializing...');
        if (!initializeAnimation()) {
            console.log('Initialization failed');
            return;
        }
        console.log('Initialization succeeded');
        // Return after initialization - user needs to click forward again to actually move
        return;
    }

    animationState.isAnimating = true;

    const currentNode = animationState.currentNode;
    console.log('Current node:', currentNode.id());

    // Get outgoing edges
    const outgoingEdges = getOutgoingEdges(currentNode);
    console.log('Outgoing edges:', outgoingEdges.length);

    if (outgoingEdges.length === 0) {
        console.log('No outgoing edges - end of path');
        animationState.isAnimating = false;
        updateButtonStates();
        return;
    }

    if (outgoingEdges.length > 1) {
        console.error('Multiple output edges detected - not supported yet');
        animationState.isAnimating = false;
        updateButtonStates();
        return;
    }

    const edge = outgoingEdges[0];
    const sourceTerminal = cy.getElementById(edge.data('source')) as NodeSingular;
    const targetTerminal = cy.getElementById(edge.data('target')) as NodeSingular;
    const targetNode = targetTerminal.parent().first();

    console.log('Animating from', currentNode.id(), 'to', targetNode.id());

    // Build waypoints: current center → output terminal → target terminal → target center
    const waypoints: Waypoint[] = [];

    // Current node center (where marker currently is)
    const currentPos = currentNode.position();
    const currentScreen = modelToScreen(currentPos.x, currentPos.y);
    console.log('Current position:', currentScreen);
    waypoints.push({ x: currentScreen.x, y: currentScreen.y, angle: 0 });

    // Output terminal position
    const outputPos = sourceTerminal.position();
    const outputScreen = modelToScreen(outputPos.x, outputPos.y);
    const angleToOutput = Math.atan2(outputScreen.y - currentScreen.y, outputScreen.x - currentScreen.x) * 180 / Math.PI;
    console.log('Output terminal:', outputScreen);
    waypoints.push({ x: outputScreen.x, y: outputScreen.y, angle: angleToOutput });

    // Target input terminal position
    const inputPos = targetTerminal.position();
    const inputScreen = modelToScreen(inputPos.x, inputPos.y);
    const angleAlongEdge = Math.atan2(inputScreen.y - outputScreen.y, inputScreen.x - outputScreen.x) * 180 / Math.PI;
    console.log('Input terminal:', inputScreen);
    waypoints.push({ x: inputScreen.x, y: inputScreen.y, angle: angleAlongEdge });

    // Target node center
    const targetPos = targetNode.position();
    const targetScreen = modelToScreen(targetPos.x, targetPos.y);
    const angleToCenter = Math.atan2(targetScreen.y - inputScreen.y, targetScreen.x - inputScreen.x) * 180 / Math.PI;
    console.log('Target center:', targetScreen);
    waypoints.push({ x: targetScreen.x, y: targetScreen.y, angle: angleToCenter });

    console.log('Built waypoints:', waypoints.length, waypoints);

    // Validate waypoints before animating
    for (let i = 0; i < waypoints.length; i++) {
        const wp = waypoints[i];
        if (!wp || isNaN(wp.x) || isNaN(wp.y) || isNaN(wp.angle)) {
            console.error('Invalid waypoint at index', i, ':', wp);
            animationState.isAnimating = false;
            updateButtonStates();
            return;
        }
    }

    // Animate along path
    await animateAlongPath(waypoints, 500);

    // Update state
    animationState.currentNode = targetNode;
    animationState.stepHistory.push(targetNode);
    animationState.isAnimating = false;

    console.log('Animation complete, now at:', targetNode.id());
    updateButtonStates();
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

// Reset animation to start
function resetAnimation(): void {
    if (animationState.isAnimating) return;

    initializeAnimation();
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

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    initCytoscape();
    initializePreviews();
    setupSidebarDragDrop();
    setupNodeDeletion();
    setupEdgeCreation();
    setupAnimationControls();

    console.log('Interactive Graph Tool initialized');
});
