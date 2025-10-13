// Global state for the current editor context
import { GraphEditorContext } from './editor_context';

export let editorContext: GraphEditorContext | null = null;

export function setEditorContext(context: GraphEditorContext | null): void {
    editorContext = context;
}