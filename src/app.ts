// Interactive Graph Tool with Cytoscape.js
// Main application logic

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
