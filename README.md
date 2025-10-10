# Interactive Graph Tool

An interactive graph editor built with Cytoscape.js and TypeScript, featuring drag-and-drop components, node manipulation, edge creation/deletion, and animated program counter simulation.

## Features

### Component Palette
- **Start Node**: Diamond-shaped entry point (1 output)
- **Stop Node**: Diamond-shaped exit point (1 input)
- **Plus Node**: Compound node with 2 inputs, 1 output
- **Combine Node**: Compound node with 2 inputs, 1 output
- **Split Node**: Compound node with 1 input, 2 outputs
- **NOP Node**: Pass-through node with 1 input, 1 output

### Animation Controls
- **PC Marker**: Visual program counter showing current execution position
- **Step Forward**: Advance to next node
- **Step Backward**: Return to previous node
- **Reset**: Return to start node
- PC marker follows pan/zoom and node movements

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

## Development

### Prerequisites

- Node.js (v16 or higher)
- npm

### Installation

```bash
npm install
```

This installs TypeScript and Cytoscape type definitions.

### Building

The project is written in TypeScript. Source files are in `src/` and compile to JavaScript in `js/`.

#### Build once

```bash
npm run build
```

#### Watch mode (auto-rebuild on changes)

```bash
npm run watch
# or
npm run dev
```

## Technical Details

### Technologies
- **TypeScript** - Type-safe application logic
- **Cytoscape.js** - Graph visualization and manipulation
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
├── src/
│   └── app.ts         # TypeScript source code
├── js/
│   └── app.js         # Compiled JavaScript (generated)
├── css/
│   └── styles.css     # Dark theme styling
├── tsconfig.json      # TypeScript configuration
├── package.json       # Dependencies and scripts
└── README.md          # Documentation
```

### Type Safety

The project uses TypeScript for improved maintainability. Key types include:

- `ComponentType`: Valid node component types
- `NodeData`: Data structure for graph nodes
- `AnimationState`: State management for PC animation
- `Position`: 2D coordinates
- `Waypoint`: Position with angle for animation paths

## Usage

### Running the Application

After building, open `index.html` in a web browser. For development, use a local server:

```bash
# Using Python 3
python3 -m http.server 8000

# Using Node.js http-server (install: npm install -g http-server)
http-server

# Using VS Code Live Server extension
# Right-click index.html and select "Open with Live Server"
```

Then navigate to `http://localhost:8000`.

### Using the Tool

1. Build the TypeScript code (see Development section)
2. Drag components from the left sidebar onto the canvas
3. Use left-click to move components
4. Use right-click + drag between terminals to create/delete edges
5. Drag components back to sidebar to delete them
6. Use animation controls on the right to step through execution

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
