import { NodeSingular } from 'cytoscape';
import { cy } from './global_state';

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
    private _contents: string;
    private _currentLocation: NodeSingular;

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
    constructor(location: NodeSingular, contents: string = "PC") {
        this._contents = contents;
        this._currentLocation = location;
        this._position = { x: 0, y: 0 };
        this._angle = 0;
        this.uniqueId = `pc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Create DOM elements
        this.createDOMElements();

        const pos = location.position();
        const screenPos = this.modelToScreen(pos.x, pos.y);
        this.updatePosition(screenPos.x, screenPos.y, 0);
        this.show();
    }

    /**
     * Get the display contents
     */
    get contents(): string {
        return this._contents;
    }

    /**
     * Set the display contents
     */
    set contents(value: string) {
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
        const pan = cy.pan();
        const zoom = cy.zoom();

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
     * Move to a specific location (node center)
     * @param target Target node
     * @param animate Whether to animate the movement (default: true)
     * @param duration Animation duration in ms (default: 500)
     */
    async moveTo(target: NodeSingular, animate: boolean = true, duration: number = 500): Promise<void> {
        if (this.isAnimating) {
            console.warn('Program counter is already animating');
            return;
        }

        const targetPos = target.position();
        const targetScreen = this.modelToScreen(targetPos.x, targetPos.y);

        if (animate) {
            this.isAnimating = true;
            const waypoints: Waypoint[] = [
                { x: this._position.x, y: this._position.y, angle: this._angle },
                { x: targetScreen.x, y: targetScreen.y, angle: 0 }
            ];
            await this.animateAlongPath(waypoints, duration);
            this.isAnimating = false;
        } else {
            this.updatePosition(targetScreen.x, targetScreen.y, 0);
        }

        this._currentLocation = target;
    }

    /**
     * Move to a specific screen position (useful for terminals)
     * @param x Screen X coordinate
     * @param y Screen Y coordinate
     * @param angle Arrow angle
     * @param animate Whether to animate the movement (default: true)
     * @param duration Animation duration in ms (default: 500)
     */
    async moveToPosition(x: number, y: number, angle: number, animate: boolean = true, duration: number = 500): Promise<void> {
        if (this.isAnimating) {
            console.warn('Program counter is already animating');
            return;
        }

        if (animate) {
            this.isAnimating = true;
            const waypoints: Waypoint[] = [
                { x: this._position.x, y: this._position.y, angle: this._angle },
                { x, y, angle }
            ];
            await this.animateAlongPath(waypoints, duration);
            this.isAnimating = false;
        } else {
            this.updatePosition(x, y, angle);
        }
    }

    /**
     * Move to a terminal node
     * @param terminal Terminal node
     * @param angle Arrow angle
     * @param animate Whether to animate the movement (default: true)
     * @param duration Animation duration in ms (default: 500)
     */
    async moveToTerminal(terminal: NodeSingular, angle: number, animate: boolean = true, duration: number = 500): Promise<void> {
        const terminalPos = terminal.position();
        const terminalScreen = this.modelToScreen(terminalPos.x, terminalPos.y);
        await this.moveToPosition(terminalScreen.x, terminalScreen.y, angle, animate, duration);
        this._currentLocation = terminal;
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

    /**
     * Follow an edge to its target node with a 3-step animation:
     * 1. Move from current node center to output terminal
     * 2. Move from output terminal to input terminal
     * 3. Move from input terminal to target node center
     *
     * @param edge The edge to follow (contains source and target terminal IDs)
     * @param stepDuration Duration for each step in ms (default: 200)
     * @returns The target node
     */
    async followEdge(edge: any, stepDuration: number = 200): Promise<NodeSingular> {
        if (this.isAnimating) {
            throw new Error('Program counter is already animating');
        }

        this.isAnimating = true;

        try {
            // Get terminals and target node from edge
            const sourceTerminal = cy.getElementById(edge.data('source')) as NodeSingular;
            const targetTerminal = cy.getElementById(edge.data('target')) as NodeSingular;
            const targetNode = targetTerminal.parent().first();

            // Calculate positions and angles for all 4 waypoints
            const currentPos = this._currentLocation.position();
            const currentScreen = this.modelToScreen(currentPos.x, currentPos.y);

            const outputPos = sourceTerminal.position();
            const outputScreen = this.modelToScreen(outputPos.x, outputPos.y);
            const angleToOutput = Math.atan2(outputScreen.y - currentScreen.y, outputScreen.x - currentScreen.x) * 180 / Math.PI;

            const inputPos = targetTerminal.position();
            const inputScreen = this.modelToScreen(inputPos.x, inputPos.y);
            const angleAlongEdge = Math.atan2(inputScreen.y - outputScreen.y, inputScreen.x - outputScreen.x) * 180 / Math.PI;

            const targetPos = targetNode.position();
            const targetScreen = this.modelToScreen(targetPos.x, targetPos.y);
            const angleToCenter = Math.atan2(targetScreen.y - inputScreen.y, targetScreen.x - inputScreen.x) * 180 / Math.PI;

            // Build all waypoints for the complete animation
            const waypoints: Waypoint[] = [
                { x: currentScreen.x, y: currentScreen.y, angle: angleToOutput },
                { x: outputScreen.x, y: outputScreen.y, angle: angleToOutput },
                { x: inputScreen.x, y: inputScreen.y, angle: angleAlongEdge },
                { x: targetScreen.x, y: targetScreen.y, angle: angleToCenter }
            ];

            // Animate through all waypoints (total duration = 3 * stepDuration for 3 steps)
            await this.animateAlongPath(waypoints, stepDuration * 3);

            // Update current location to target
            this._currentLocation = targetNode;

            return targetNode;
        } finally {
            this.isAnimating = false;
        }
    }
}
