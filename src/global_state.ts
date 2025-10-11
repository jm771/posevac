import { getCytoscapeStyles } from './styles';
import cytoscape, { Core } from 'cytoscape';

export let cy: Core;

// Initialize Cytoscape
export function initCytoscape(): void {
    const container = document.getElementById('cy');
    if (!container) {
        throw new Error('Cytoscape container element not found');
    }

    cy = cytoscape({
        container: container,
        style: getCytoscapeStyles(),
        layout: {
            name: 'preset'
        },
        // Interaction settings
        minZoom: 0.5,
        maxZoom: 2,
        wheelSensitivity: 0.2,
        // Disable default behaviors we'll implement custom
        autoungrabify: false,
        userPanningEnabled: true,
        userZoomingEnabled: true,
        boxSelectionEnabled: false
    });
}