// Interactive Graph Tool with Cytoscape.js
// Main application logic - Level-based game mode

import { setupAnimationControls } from './animation';
import { setupEdgeCreation } from './edge_creation';
import { AnimationState, GraphEditorContext, LevelContext } from './editor_context';
import { initializePreviews, setupNodeDeletion, setupSidebarDragDrop } from './sidebar';
import { initializeLevelSelector, showLevelSelector, showGraphEditor, updateLevelInfo } from './level_selector';
import { Level } from './levels';
import { downloadGraphAsJSON, loadGraphFromFile } from './graph_serialization';
import { initializeConstantControls } from './constant_controls';
import { initializeEdgeEditor } from './edge_editor';


/**
 * Start a level - create editor context and set up the graph editor
 */
function startLevel(level: Level): void {
    console.log(`Starting level: ${level.name}`);

    // Create new editor context for this level
    const levelContext = new LevelContext(new GraphEditorContext(level), null);

    // Update level info display
    updateLevelInfo(level);

    // Initialize sidebar with level's allowed nodes
    initializePreviews(level.allowedNodes);

    // Set up interactions (only needs to be done once, but safe to call multiple times)
    setupSidebarDragDrop(levelContext.editorContex);
    setupNodeDeletion(currentEditor);
    setupEdgeCreation(currentEditor.cy);
    setupAnimationControls();

    // Initialize constant node HTML labels
    initializeConstantControls();

    // Initialize edge editor for conditions
    initializeEdgeEditor(currentEditor.cy);

    // Show the graph editor
    showGraphEditor();

    const menuBtn = document.getElementById('menuBtn');
    if (menuBtn) {
        menuBtn.addEventListener('click', () => returnToMenu(curre)));
    }

    console.log('Level started successfully');
}

/**
 * Return to main menu
 */
function returnToMenu(currentContext: LevelContext): void {
    console.log('Returning to main menu');
    currentContext.destroy();
    showLevelSelector();
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    console.log('Interactive Graph Tool - Game Mode');

    // Initialize level selector
    initializeLevelSelector(startLevel);

    // Set up menu button

    // How is this not on the level? Maybe we need to let this fail for now?


    // Set up save/load buttons
    setupSaveLoadButtons();

    // Show level selector (initial screen)
    showLevelSelector();

    console.log('Application initialized - Select a level to begin');
});

/**
 * Set up save and load button event listeners
 */
function setupSaveLoadButtons(): void {
    const saveBtn = document.getElementById('saveBtn');
    const loadBtn = document.getElementById('loadBtn');
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;

    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            if (!currentEditor) {
                alert('No graph to save. Please start a level first.');
                return;
            }

            try {
                downloadGraphAsJSON(currentEditor);
                console.log('Graph saved successfully');
            } catch (error) {
                console.error('Error saving graph:', error);
                alert(`Error saving graph: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        });
    }

    if (loadBtn && fileInput) {
        loadBtn.addEventListener('click', () => {
            if (!currentEditor) {
                alert('Please start a level before loading a graph.');
                return;
            }

            // Trigger file input
            fileInput.click();
        });

        fileInput.addEventListener('change', async (event) => {
            if (!currentEditor) {
                return;
            }

            const input = event.target as HTMLInputElement;
            const file = input.files?.[0];

            if (!file) {
                return;
            }

            try {
                await loadGraphFromFile(currentEditor, file);
                console.log('Graph loaded successfully');
                alert('Graph loaded successfully!');
            } catch (error) {
                console.error('Error loading graph:', error);
                alert(`Error loading graph: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }

            // Clear the file input so the same file can be loaded again
            input.value = '';
        });
    }
}
