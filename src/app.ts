import { setupAnimationControls } from './animation';
import { setupEdgeCreation } from './edge_creation';
import { LevelContext } from './editor_context';
import { setupNodeDeletion, setupSidebarDragDrop } from './components/Sidebar';
import { initializeConstantControls } from './constant_controls';
import { initializeEdgeEditor } from './edge_editor';


export function startLevel(levelContext : LevelContext): LevelContext {
    setupSidebarDragDrop(levelContext.editorContext);
    setupNodeDeletion(levelContext);
    setupEdgeCreation(levelContext);
    setupAnimationControls(levelContext);
    initializeConstantControls(levelContext.editorContext);
    initializeEdgeEditor(levelContext.editorContext.cy);

    console.log('Level started successfully');

    return levelContext;
}