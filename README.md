# Interactive Graph Tool

An interactive graph editor built with Cytoscape.js featuring drag-and-drop components, node manipulation, and edge creation/deletion.

## Features

### Component Palette
- **Regular Node**: Simple circular graph node
- **Compound Object**: Logic gate-style component with 2 input terminals and 1 output terminal

### Interactions

#### Creating Components
- Drag components from the sidebar onto the canvas
- Each drag creates a copy, leaving the original in the sidebar
- Drop anywhere on the canvas to place the component

#### Moving Components
- **Left-click + drag** to move nodes around the canvas
- Compound objects move as a unit with their terminals

#### Creating/Deleting Edges
- **Right-click + drag** from source node to target node
  - If no edge exists: creates a new directed edge
  - If edge already exists: deletes the edge
- Visual feedback shows temporary edge during drag
- Connections can be made between:
  - Regular nodes
  - Terminal nodes (inputs/outputs of compound objects)
  - Output terminals to input terminals of the same compound object
- Cannot connect to compound parent nodes directly
- Cannot connect a terminal to itself

#### Deleting Components
- Drag any node back into the sidebar area to delete it
- Visual "drop here to delete" indicator activates when dragging over sidebar
- Deleting a compound object removes all its terminals
- Connected edges are automatically removed when nodes are deleted

## Technical Details

### Technologies
- **Cytoscape.js** - Graph visualization and manipulation
- **Vanilla JavaScript** - Application logic
- **HTML5 Drag & Drop API** - Sidebar component dragging
- **CSS3** - Dark IDE-themed styling

### Color Scheme
Dark theme inspired by modern IDEs with syntax highlighting colors:
- Background: Dark charcoal (#1e1e1e)
- Accents: Blue, Green, Orange, Purple (syntax highlighting palette)
- Regular nodes: Blue (#4fc3f7)
- Input terminals: Green (#81c784)
- Output terminals: Orange (#ffb74d)
- Compound objects: Purple border (#ba68c8)

### Project Structure
```
interactive-graph-tool/
├── index.html          # Main HTML structure
├── css/
│   └── styles.css     # Dark theme styling
├── js/
│   └── app.js         # Application logic
└── README.md          # Documentation
```

## Usage

1. Open `index.html` in a modern web browser
2. Drag components from the left sidebar onto the canvas
3. Use left-click to move components
4. Use right-click + drag to create/delete edges
5. Drag components back to sidebar to delete them

## Browser Compatibility

Works in modern browsers supporting:
- ES6 JavaScript
- HTML5 Drag & Drop API
- CSS3 features

Tested on Chrome, Firefox, Edge, and Safari.

## Future Enhancements

Potential features for future versions:
- Save/load graph state
- Export to JSON/image
- Undo/redo functionality
- Custom node labels
- Multiple edge styles
- Grid snapping
- Component library expansion
- Keyboard shortcuts
