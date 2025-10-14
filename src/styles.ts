import { StylesheetJson } from 'cytoscape';

// Get shared Cytoscape styles (used for main canvas and previews)
export function getCytoscapeStyles(): StylesheetJson {
    return [
        // Start node styles
        {
            selector: 'node[type="input"]',
            style: {
                'background-color': '#81c784',
                'shape': 'roundrectangle',
                'label': 'data(label)',
                'color': 'white',
                'text-valign': 'center',
                'text-halign': 'center',
                'font-size': 12,
                'font-weight': 'bold',
                'border-width': 3,
                'border-color': '#81c784',
                'padding': "5",  // Allow terminals at the edges
                'compound-sizing-wrt-labels': 'include'  // Include label in size calculation
            }
        },
        // Stop node styles
        {
            selector: 'node[type="output"]',
            style: {
                'background-color': '#e57373',
                'shape': 'roundrectangle',
                'label': 'data(label)',
                'color': 'white',
                'text-valign': 'center',
                'text-halign': 'center',
                'font-size': 12,
                'font-weight': 'bold',
                'border-width': 3,
                'border-color': '#e57373',
                'padding-right': '200',
                'padding': '5',  // Allow terminals at the edges
                'compound-sizing-wrt-labels': 'include'  // Include label in size calculation
            }
        },
        {
            selector: 'node[id="temp-target"]',
            style: { 'opacity': 0, 'width': 1, 'height': 1 }
        },
        // Compound parent node styles
        {
            selector: 'node[type="compound"]',
            style: {
                'background-color': '#2d2d30',
                'border-width': 2,
                'border-color': '#ba68c8',
                'label': 'data(label)',
                'color': '#d4d4d4',
                'text-valign': 'center',
                'text-halign': 'center',
                'font-size': '11',
                'padding': '5',
                'shape': 'round-rectangle',
            }
        },
        // Constant node styles
        {
            selector: 'node[type="constant"]',
            style: {
                'background-color': '#4a4a4a',
                'border-width': 2,
                'border-color': '#64b5f6',
                'label': '',  // No label - we use HTML overlay instead
                'color': '#d4d4d4',
                'text-valign': 'center',
                'text-halign': 'center',
                'font-size': '11',
                'padding': '5',
                'shape': 'round-rectangle',
            }
        },
        // Input terminal styles (children of compound)
        {
            selector: 'node[type="input-terminal"]',
            style: {
                'background-color': '#81c784',
                'width': 12,
                'height': 12,
                'border-width': 2,
                'border-color': '#81c784',
                'label': '',
                'events': 'yes'
            }
        },
        // Output terminal styles (children of compound)
        {
            selector: 'node[type="output-terminal"]',
            style: {
                'background-color': '#ffb74d',
                'width': 12,
                'height': 12,
                'border-width': 2,
                'border-color': '#ffb74d',
                'label': '',
                'events': 'yes'
            }
        },
        {
            selector: 'node[type="invisible-terminal"]',
            style: {
                'opacity': 0,             // Transparent
                'background-opacity': 0,
                'border-opacity': 0,
                'text-opacity': 0
            }
        },
        // Edge styles
        {
            selector: 'edge',
            style: {
                'width': 2,
                'line-color': '#4fc3f7',
                'target-arrow-color': '#4fc3f7',
                'target-arrow-shape': 'triangle',
                'curve-style': 'bezier',
                'arrow-scale': 1.5,
                'label': 'data(condition)',
                'font-size': '10',
                'text-background-color': '#2d2d30',
                'text-background-opacity': 0.8,
                'text-background-padding': '3',
                'text-background-shape': 'roundrectangle',
                'color': '#ffffff'
            }
        },
        // Temporary edge (during right-click drag)
        {
            selector: 'edge.temp',
            style: {
                'line-color': '#ffb74d',
                'target-arrow-color': '#ffb74d',
                'line-style': 'dashed',
                'opacity': 0.6
            }
        },
        // Selected elements
        {
            selector: ':selected',
            style: {
                'border-color': '#ffb74d',
                'border-width': 4
            }
        }
    ];
}