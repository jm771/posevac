import { EdgeSingular, NodeSingular } from 'cytoscape';
import { editorContext } from './global_state';
import { getTerminalProgramCounters } from './nodes';

// Helper to get cy from context
function getCy() {
    if (!editorContext) {
        throw new Error('Editor context not initialized');
    }
    return editorContext.cy;
}

interface Position {
    x: number;
    y: number;
}

interface Waypoint extends Position {
    angle: number;
}

/**
 * Represents a program counter marker that can be animated through the graph
 */
export class ProgramCounter {
    // Display properties
    private _contents: any;
    private _currentLocation: NodeSingular;
    private _currentEdge: EdgeSingular | null;

    // Position state
    private _position: Position;
    private _angle: number;

    // DOM elements (initialized in createDOMElements called by constructor)
    private svgElement!: SVGElement;
    private arrowLine!: SVGLineElement;
    private arrowHead!: SVGPolygonElement;
    private boxElement!: HTMLDivElement;

    // Animation state
    private isAnimating: boolean = false;
    private uniqueId: string;

    /**
     * Create a new program counter
     * @param location Initial location (node or terminal)
     * @param contents Display text (default: "PC")
     */
    constructor(location: NodeSingular, edge: EdgeSingular | null, contents: any) {
        this._contents = contents;
        this._currentLocation = location;
        this._currentEdge = edge;
        this._position = { x: 0, y: 0 };
        this._angle = 0;
        this.uniqueId = `pc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Create DOM elements
        this.createDOMElements();
    }

    /**
     * Get the unique ID of this program counter
     */
    get id(): string {
        return this.uniqueId;
    }

    /**
     * Get the display contents
     */
    get contents(): any {
        return this._contents;
    }

    /**
     * Set the display contents
     */
    set contents(value: any) {
        this._contents = value;
        this.boxElement.textContent = value;
    }

    /**
     * Get the current location
     */
    get currentLocation(): NodeSingular  {
        return this._currentLocation;
    }

    /**
     * Get the current screen position
     */
    get position(): Position {
        return { ...this._position };
    }

    /**
     * Get the current angle
     */
    get angle(): number {
        return this._angle;
    }

    /**
     * Create the DOM elements for this program counter
     */
    private createDOMElements(): void {
        // Create SVG element for arrow
        this.svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.svgElement.setAttribute('class', 'pc-arrow-overlay');
        this.svgElement.setAttribute('id', `pcArrow-${this.uniqueId}`);
        this.svgElement.style.display = 'none';

        // Create arrow line
        this.arrowLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        this.arrowLine.setAttribute('stroke', '#ffeb3b');
        this.arrowLine.setAttribute('stroke-width', '3');
        this.svgElement.appendChild(this.arrowLine);

        // Create arrow head
        this.arrowHead = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        this.arrowHead.setAttribute('fill', '#ffeb3b');
        this.svgElement.appendChild(this.arrowHead);

        // Create PC box
        this.boxElement = document.createElement('div');
        this.boxElement.className = 'pc-box';
        this.boxElement.id = `pcBox-${this.uniqueId}`;
        this.boxElement.textContent = this._contents;
        this.boxElement.style.display = 'none';

        // Add to DOM
        const canvasContainer = document.querySelector('.canvas-container');
        if (canvasContainer) {
            canvasContainer.appendChild(this.svgElement);
            canvasContainer.appendChild(this.boxElement);
        } else {
            console.error('Canvas container not found');
        }
    }

    /**
     * Remove this program counter from the DOM
     */
    destroy(): void {
        if (this.svgElement.parentNode) {
            this.svgElement.parentNode.removeChild(this.svgElement);
        }
        if (this.boxElement.parentNode) {
            this.boxElement.parentNode.removeChild(this.boxElement);
        }
    }

    /**
     * Show the program counter
     */
    show(): void {
        this.svgElement.style.display = 'block';
        this.boxElement.style.display = 'flex';
    }

    /**
     * Hide the program counter
     */
    hide(): void {
        this.svgElement.style.display = 'none';
        this.boxElement.style.display = 'none';
    }

    /**
     * Update the visual position of the program counter
     * @param arrowTipX X coordinate of arrow tip (screen coordinates)
     * @param arrowTipY Y coordinate of arrow tip (screen coordinates)
     * @param arrowAngle Angle of the arrow in degrees
     */
    updatePosition(arrowTipX: number, arrowTipY: number, arrowAngle: number): void {
        // Store position
        this._position = { x: arrowTipX, y: arrowTipY };
        this._angle = arrowAngle;

        // PC box should be offset above and to the side of the arrow tip
        const offsetDistance = 50; // pixels
        const offsetAngle = arrowAngle - 30; // 30 degrees counter-clockwise from arrow direction

        const pcCenterX = arrowTipX + offsetDistance * Math.cos(offsetAngle * Math.PI / 180);
        const pcCenterY = arrowTipY + offsetDistance * Math.sin(offsetAngle * Math.PI / 180);

        // Position the PC box (uses transform: translate(-50%, -50%) to center)
        this.boxElement.style.left = pcCenterX + 'px';
        this.boxElement.style.top = pcCenterY + 'px';

        // Draw arrow from PC center to arrow tip
        this.arrowLine.setAttribute('x1', pcCenterX.toString());
        this.arrowLine.setAttribute('y1', pcCenterY.toString());
        this.arrowLine.setAttribute('x2', arrowTipX.toString());
        this.arrowLine.setAttribute('y2', arrowTipY.toString());

        // Arrowhead at the tip
        const arrowheadSize = 10;
        const angle = Math.atan2(arrowTipY - pcCenterY, arrowTipX - pcCenterX);
        const x1 = arrowTipX;
        const y1 = arrowTipY;
        const x2 = arrowTipX - arrowheadSize * Math.cos(angle - Math.PI / 6);
        const y2 = arrowTipY - arrowheadSize * Math.sin(angle - Math.PI / 6);
        const x3 = arrowTipX - arrowheadSize * Math.cos(angle + Math.PI / 6);
        const y3 = arrowTipY - arrowheadSize * Math.sin(angle + Math.PI / 6);

        this.arrowHead.setAttribute('points', `${x1},${y1} ${x2},${y2} ${x3},${y3}`);
    }

    /**
     * Convert model coordinates to screen coordinates
     */
    private modelToScreen(modelX: number, modelY: number): Position {
        const pan = getCy().pan();
        const zoom = getCy().zoom();

        const renderedX = modelX * zoom + pan.x;
        const renderedY = modelY * zoom + pan.y;

        return { x: renderedX, y: renderedY };
    }

    /**
     * Animate along a path with multiple waypoints
     */
    private animateAlongPath(waypoints: Waypoint[], duration: number): Promise<void> {
        return new Promise((resolve) => {
            if (!waypoints || waypoints.length === 0) {
                console.error('No waypoints provided for animation');
                resolve();
                return;
            }

            const startTime = performance.now();

            const animate = (currentTime: number): void => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(Math.max(elapsed / duration, 0), 1);

                // Find which segment we're on
                const segmentCount = waypoints.length - 1;

                if (segmentCount <= 0) {
                    // Only one waypoint, just position there
                    this.updatePosition(waypoints[0].x, waypoints[0].y, waypoints[0].angle);
                    resolve();
                    return;
                }

                const segmentProgress = progress * segmentCount;
                const segmentIndex = Math.floor(segmentProgress);
                const localProgress = segmentProgress - segmentIndex;

                if (segmentIndex >= segmentCount) {
                    // Animation complete - position at final waypoint
                    const final = waypoints[waypoints.length - 1];
                    this.updatePosition(final.x, final.y, final.angle);
                    resolve();
                    return;
                }

                // Interpolate between current and next waypoint
                const current = waypoints[segmentIndex];
                const next = waypoints[segmentIndex + 1];

                if (!current || !next) {
                    console.error('Invalid waypoint');
                    resolve();
                    return;
                }

                const x = current.x + (next.x - current.x) * localProgress;
                const y = current.y + (next.y - current.y) * localProgress;
                const angle = current.angle + (next.angle - current.angle) * localProgress;

                this.updatePosition(x, y, angle);

                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    resolve();
                }
            };

            requestAnimationFrame(animate);
        });
    }

    /**
     * Update position based on current location (for viewport changes)
     */
    updateForViewportChange(): void {
        if (!this._currentLocation || this.isAnimating) {
            return;
        }

        const currentPos = this._currentLocation.position();
        const screenPos = this.modelToScreen(currentPos.x, currentPos.y);
        this.updatePosition(screenPos.x, screenPos.y, this._angle);
    }

    tryAdvance() : NodeSingular | null {
        if (this._currentEdge != null)
        {
            const dest = getCy().getElementById(this._currentEdge.data('target'));
            if (getTerminalProgramCounters(dest).size === 0) {
                getTerminalProgramCounters(dest).set(this.id, this);
            }

            getTerminalProgramCounters(this._currentLocation).delete(this.id);
            this._currentEdge = null;

            return dest;
        }

        return null;
    }

    initializePositionAndShow(target: NodeSingular) {
        const pos = target.position();
        const screenPos = this.modelToScreen(pos.x, pos.y);
        this.updatePosition(screenPos.x, screenPos.y, 0);
        this.show();
    }

    async animateMoveToNode(startPosition: NodeSingular, target: NodeSingular, stepDuration: number = 200) {
        if (this.isAnimating) {
            throw new Error('Program counter is already animating');
        }

        const currentPos = startPosition.position();

        this.isAnimating = true;
        this._currentLocation = target

        try {
            
            const currentScreen = this.modelToScreen(currentPos.x, currentPos.y);

            const outputPos = target.position();
            const outputScreen = this.modelToScreen(outputPos.x, outputPos.y);
            const angleToOutput = Math.atan2(outputScreen.y - currentScreen.y, outputScreen.x - currentScreen.x) * 180 / Math.PI;

            const waypoints: Waypoint[] = [
                { x: currentScreen.x, y: currentScreen.y, angle: angleToOutput },
                { x: outputScreen.x, y: outputScreen.y, angle: angleToOutput },
            ];

            await this.animateAlongPath(waypoints, stepDuration);
            
        } finally {
            this.isAnimating = false
        }
    }
}
