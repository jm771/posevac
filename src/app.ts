// Interactive Graph Tool with Cytoscape.js
// Main application logic

import { setupAnimationControls } from './animation';
import { setupEdgeCreation } from './edge_creation';
import { initCytoscape } from './global_state'
import { initializePreviews, setupNodeDeletion, setupSidebarDragDrop } from './sidebar';

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
