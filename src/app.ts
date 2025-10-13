// Interactive Graph Tool with Cytoscape.js
// Main application logic - Level-based game mode

import { setupAnimationControls } from './animation';
import { setupEdgeCreation } from './edge_creation';
import { setEditorContext } from './global_state';
import { GraphEditorContext } from './editor_context';
import { initializePreviews, setupNodeDeletion, setupSidebarDragDrop } from './sidebar';
import { initializeLevelSelector, showLevelSelector, showGraphEditor, updateLevelInfo } from './level_selector';
import { Level } from './levels';

// Global reference to current editor context
let currentEditor: GraphEditorContext | null = null;

/**
 * Start a level - create editor context and set up the graph editor
 */
function startLevel(level: Level): void {
    console.log(`Starting level: ${level.name}`);

    // Clean up previous editor if it exists
    if (currentEditor) {
        currentEditor.destroy();
    }

    // Create new editor context for this level
    currentEditor = new GraphEditorContext(level);
    setEditorContext(currentEditor);

    // Update level info display
    updateLevelInfo(level);

    // Initialize sidebar with level's allowed nodes
    initializePreviews(level.allowedNodes);

    // Set up interactions (only needs to be done once, but safe to call multiple times)
    setupSidebarDragDrop(currentEditor);
    setupNodeDeletion(currentEditor);
    setupEdgeCreation(currentEditor.cy);
    setupAnimationControls();

    // Show the graph editor
    showGraphEditor();

    console.log('Level started successfully');
}

/**
 * Return to main menu
 */
function returnToMenu(): void {
    console.log('Returning to main menu');

    // Clean up current editor
    if (currentEditor) {
        currentEditor.destroy();
        currentEditor = null;
        setEditorContext(null);
    }

    // Show level selector
    showLevelSelector();
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    console.log('Interactive Graph Tool - Game Mode');

    // Initialize level selector
    initializeLevelSelector(startLevel);

    // Set up menu button
    const menuBtn = document.getElementById('menuBtn');
    if (menuBtn) {
        menuBtn.addEventListener('click', returnToMenu);
    }

    // Show level selector (initial screen)
    showLevelSelector();

    console.log('Application initialized - Select a level to begin');
});
