# Component Redesign Plan

## Overview
Replace the current generic "Regular Node" and "Compound Object" with specific named components for a more functional graph system.

## Current Components (To Be Replaced)
- Regular Node (generic blue circle)
- Compound Object (2 inputs, 1 output)

## New Components

### Regular Nodes (2 types)
Simple circular nodes with labels displayed on them:

1. **Start Node**
   - Label: "start"
   - Visual: Circular node (similar to current regular node)
   - Color: Green (#81c784) - indicates beginning
   - No inputs, used as source nodes

2. **Stop Node**
   - Label: "stop"
   - Visual: Circular node
   - Color: Red (#e57373) - indicates termination
   - No outputs, used as sink nodes

### Compound Objects (4 types)
Logic gate / flow control style components with labeled terminals:

1. **Plus (Addition) Node**
   - Label: "+"
   - Structure: 2 inputs (left), 1 output (right)
   - Color: Purple border (#ba68c8)
   - Use case: Combining/adding two streams

2. **Combine Node**
   - Label: "combine"
   - Structure: 2 inputs (left), 1 output (right)
   - Color: Purple border (#ba68c8)
   - Use case: Merging two data streams

3. **Split Node**
   - Label: "split"
   - Structure: 1 input (left), 2 outputs (right)
   - Color: Purple border (#ba68c8)
   - Use case: Branching/splitting one stream into two

4. **NOP (No Operation) Node**
   - Label: "nop"
   - Structure: 1 input (left), 1 output (right)
   - Color: Purple border (#ba68c8)
   - Use case: Pass-through/placeholder

## Implementation Tasks

### 1. Update Sidebar HTML
- Replace existing component templates
- Add 6 new component templates (2 regular + 4 compound)
- Each template shows preview with component label

### 2. Update CSS
- Style previews for start/stop nodes with appropriate colors
- Style previews for each compound type (different terminal configurations)
- Ensure labels are visible in both sidebar and canvas

### 3. Update JavaScript

#### 3.1 Node Creation Functions
- Replace `createRegularNode()` with:
  - `createStartNode(x, y)` - creates start node
  - `createStopNode(x, y)` - creates stop node

- Replace `createCompoundObject()` with:
  - `createPlusNode(x, y)` - 2 inputs, 1 output
  - `createCombineNode(x, y)` - 2 inputs, 1 output
  - `createSplitNode(x, y)` - 1 input, 2 outputs
  - `createNopNode(x, y)` - 1 input, 1 output

#### 3.2 Cytoscape Styles
- Update node styles to include labels
- Add color variations for start (green) and stop (red)
- Keep compound objects with purple borders
- Ensure labels are readable on canvas nodes

#### 3.3 Sidebar Drop Handler
- Update component-type handling in drop event
- Map new component types to creation functions

### 4. Terminal Positioning
Need to calculate different terminal positions for different compound types:

- **2 inputs, 1 output** (Plus, Combine):
  - Input 1: left side, top position
  - Input 2: left side, bottom position
  - Output: right side, center

- **1 input, 2 outputs** (Split):
  - Input: left side, center
  - Output 1: right side, top position
  - Output 2: right side, bottom position

- **1 input, 1 output** (NOP):
  - Input: left side, center
  - Output: right side, center

## Design Decisions

### Labels
- Regular nodes: Label displayed on the node itself
- Compound objects: Label displayed at top/center of compound box

### Colors
- Start: Green (#81c784) - positive, beginning
- Stop: Red (#e57373) - end, termination
- All compound objects: Purple border (#ba68c8) - consistent functional appearance
- Input terminals: Green (#81c784)
- Output terminals: Orange (#ffb74d)

### Sizing
- Keep current dimensions for consistency
- Regular nodes: 40px diameter
- Compound boxes: ~80-100px width, 60px height
- Terminals: 12px diameter

## Questions/Considerations

1. **Node IDs**: Should we use descriptive prefixes?
   - `start-1`, `stop-1`, `plus-1`, `combine-1`, `split-1`, `nop-1`

2. **Visual Differentiation**:
   - Plus and Combine both have same structure - should they look different?
   - Suggestion: Keep same structure but different labels make them distinct

3. **Counter Management**:
   - Should each node type have its own counter?
   - Or use a single global counter for all nodes?

## Testing Checklist
After implementation, verify:
- [ ] All 6 components appear in sidebar with correct previews
- [ ] All components can be dragged onto canvas
- [ ] Labels are visible and readable on canvas
- [ ] Terminal positions are correct for each compound type
- [ ] Edges can connect between appropriate terminals
- [ ] Color coding is correct (green start, red stop, purple compounds)
- [ ] Drag to delete works for all component types
- [ ] Right-click edge creation works with all node types

## Migration Notes
- Remove old generic "Regular Node" and "Compound Object"
- Update any counter/ID generation logic
- Ensure backward compatibility isn't required (new tool, fresh start)
