// Global state for the current editor context
import { GraphEditorContext } from './editor_context';
import { Core } from 'cytoscape';

export let editorContext: GraphEditorContext | null = null;

// Export cy as a mutable reference that gets updated when context changes
export let cy: Core = null as any;

export function setEditorContext(context: GraphEditorContext | null): void {
    editorContext = context;
    if (context) {
        cy = context.cy;
    }
}