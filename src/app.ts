import { setupAnimationControls } from './animation';
import { setupEdgeCreation } from './edge_creation';
import { GraphEditorContext, LevelContext } from './editor_context';
import { setupNodeDeletion, setupSidebarDragDrop } from './components/Sidebar';
import { Level } from './levels';
import { downloadGraphAsJSON, loadGraphFromFile } from './graph_serialization';
import { initializeConstantControls } from './constant_controls';
import { initializeEdgeEditor } from './edge_editor';


export function startLevel(level: Level): LevelContext {
    console.log(`Starting level: ${level.name}`);

    const levelContext = new LevelContext(new GraphEditorContext(level), null);

    // initializePreviews(level.allowedNodes);
    setupSidebarDragDrop(levelContext.editorContex);
    setupNodeDeletion(levelContext);
    setupEdgeCreation(levelContext);
    setupAnimationControls(levelContext);
    initializeConstantControls(levelContext.editorContex);
    initializeEdgeEditor(levelContext.editorContex.cy);
    setupSaveLoadButtons(levelContext);

    console.log('Level started successfully');

    return levelContext;
}

export function setupSaveLoadButtons(levelContext: LevelContext): void {
    const currentEditor = levelContext.editorContex;
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
